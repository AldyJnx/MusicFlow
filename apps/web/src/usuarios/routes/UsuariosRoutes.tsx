import ClientRoutes from "../../client/routes/clientRoutes";
import { RequireUser } from "../../shared/guards/RequireUser";

// User-facing routes are isolated here so user modules can migrate out of the
// legacy `client` folder incrementally without changing public URLs.
export default function UsuariosRoutes() {
  return (
    <RequireUser>
      <ClientRoutes />
    </RequireUser>
  );
}
