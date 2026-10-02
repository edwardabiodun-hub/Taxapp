import { Link } from "react-router-dom";
import ErrorState from "@/components/shared/ErrorState";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-md px-4">
        <ErrorState
          errorCode="NOT_FOUND"
          action={{ label: "Return to Home", onClick: () => window.location.assign("/") }}
        />
        <Link to="/" className="sr-only">Return to Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
