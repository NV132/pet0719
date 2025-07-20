import { Suspense } from "react";
import UserManagementPage from "./UserManagementPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserManagementPage />
    </Suspense>
  );
} 