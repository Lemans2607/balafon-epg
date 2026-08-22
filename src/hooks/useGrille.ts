import { useCallback, useEffect, useRef, useState } from "react";
import type { Chaine, Emission, Statut } from "../utils/epgHelpers";
import { getChaines, getEmissions, MODE_DEMO } from "../api";
import { CANAL_WS } from "../api/mockDb";

export interface WsMessage {
  type: "grille.mise_a_jour" | "grille.validee" | "regie.vmix";
  emission?: Emission;
  ts: number;
}

const WS_URL: string = (import.meta.env.VITE_WS_URL as string | undefined) ?? "";

/**
 * Abonnement temps réel : WebSocket Django Channels si VITE_WS_URL est défini,
 * sinon BroadcastChannel (les onglets ouverts se synchronisent en direct).
 */
export function useWsEvents(handler: (msg: WsMessage) => void): "ouvert" | "ferme" {
  const [statut, setStatut] = useState<"ouvert" | "ferme">("ferme");
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!MODE_DEMO && WS_URL) {
      let ws: WebSocket | null = null;
      let ferme = false;
      let retry: ReturnType<typeof setTimeout>;
      const connecter = () => {
        ws = new WebSocket(WS_URL);
        ws.onopen = () => setStatut("ouvert");
        ws.onmessage = (ev) => {
          try {
            handlerRef.current(JSON.parse(ev.data as string) as WsMessage);
          } catch {
            /* message ignoré */
          }
        };
        ws.onclose = () => {
          setStatut("ferme");
          if (!ferme) retry = setTimeout(connecter, 3000);
        };
      };
      connecter();
      return () => {
        ferme = true;
        clearTimeout(retry);
        ws?.close();
      };
    }
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(CANAL_WS);
      bc.onmessage = (ev: MessageEvent<WsMessage>) => handlerRef.current(ev.data);
      setStatut("ouvert");
    } catch {
      setStatut("ferme");
    }
    return () => bc?.close();
  }, []);

  return statut;
}

export function useGrille(statut?: Statut) {
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [chaines, setChaines] = useState<Chaine[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const premierChargement = useRef(true);

  const charger = useCallback(async () => {
    if (premierChargement.current) setChargement(true);
    try {
      const [em, ch] = await Promise.all([getEmissions(statut), getChaines()]);
      setEmissions(em);
      setChaines(ch);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Impossible de charger la grille.");
    } finally {
      premierChargement.current = false;
      setChargement(false);
    }
  }, [statut]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const wsStatut = useWsEvents((msg) => {
    if (msg.type === "grille.mise_a_jour" || msg.type === "grille.validee") void charger();
  });

  return { emissions, chaines, chargement, erreur, recharger: charger, wsStatut };
}
