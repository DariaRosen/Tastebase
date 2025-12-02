// Session bootstrap is no longer needed with MongoDB auth
// Sessions are handled via cookies in API routes
export default function SessionBootstrap() {
  return null;
}
