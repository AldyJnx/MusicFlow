import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getArtistPortalContext,
  type ArtistMembership,
} from "../../shared/api/artist-portal";

type Value = {
  memberships: ArtistMembership[];
  selected: ArtistMembership;
  selectArtist: (artistId: string) => void;
};

const Context = createContext<Value | null>(null);

export function ArtistPortalProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ["artist-portal", "context"],
    queryFn: getArtistPortalContext,
    // A new membership is created after an administrator approves a request.
    // Keep the gate current while a request is being reviewed so it moves the
    // user to the portal without requiring a logout or manual refresh.
    refetchInterval: (query) =>
      query.state.data?.memberships.length ||
      !query.state.data?.requests.some(
        (request) => request.status === "PENDING",
      )
        ? false
        : 30_000,
  });
  const memberships = useMemo(
    () => data?.memberships ?? [],
    [data?.memberships],
  );
  const [selectedId, setSelectedId] = useState(() =>
    localStorage.getItem("musicflow-artist-workspace"),
  );
  const selected =
    memberships.find((item) => item.artist.id === selectedId) ?? memberships[0];

  useEffect(() => {
    if (selected)
      localStorage.setItem("musicflow-artist-workspace", selected.artist.id);
  }, [selected]);

  const value = useMemo(
    () => ({ memberships, selected, selectArtist: setSelectedId }),
    [memberships, selected],
  );
  if (!selected) return null;
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useArtistPortal() {
  const value = useContext(Context);
  if (!value)
    throw new Error("useArtistPortal must be used inside ArtistPortalProvider");
  return value;
}
