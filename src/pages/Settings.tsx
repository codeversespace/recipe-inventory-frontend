import { Alert, Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { ChangeEvent, useState } from "react";
import { useAuthActivities, useAuthRoles, useAuthUsers, useCreateAuthUser, useResetAuthPassword, useUpdateAuthUser } from "../hooks/useApi";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";

export const Settings = () => {
  const { user } = useAuth();
  const { data: users = [] } = useAuthUsers(user?.role === "super_admin");
  const { data: roles = [] } = useAuthRoles(user?.role === "super_admin");
  const { data: activities = [] } = useAuthActivities(user?.role === "super_admin");
  const createUser = useCreateAuthUser();
  const updateUser = useUpdateAuthUser();
  const resetPassword = useResetAuthPassword();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [showCount, setShowCount] = useState(5);
  const visibleActivities = activities.slice(0, showCount);
  const hasMoreActivities = showCount < activities.length;
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetValue, setResetValue] = useState("");
  const [error, setError] = useState("");

  const createManagedUser = async () => {
    try {
      await createUser.mutateAsync({ username: newUsername.trim(), password: newPassword, role: newRole });
      setNewUsername("");
      setNewPassword("");
      setNewRole("viewer");
      setError("");
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not create user.");
    }
  };

  const resetManagedPassword = async () => {
    if (!resetUserId) return;
    try {
      await resetPassword.mutateAsync({ id: resetUserId, password: resetValue });
      setResetUserId(null);
      setResetValue("");
      setError("");
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not reset password.");
    }
  };

  const downloadBackup = async () => {
    const response = await api.get("/backup/download", { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "recipe-inventory-backup.db";
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post("/backup/restore", form);
      window.location.reload();
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not restore database.");
    }
  };

  const clearDatabase = async () => {
    if (!window.confirm("DELETE ALL business data? This cannot be undone. User accounts will be preserved.")) return;
    try {
      await api.delete("/auth/database");
      window.location.reload();
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not clear database.");
    }
  };

  const resetAllData = async () => {
    if (!window.confirm("Reset all transactional data?\n\n• All sales, purchases, batches, orders & payments will be deleted\n• Items, suppliers, recipes & customers will be KEPT\n• All item quantities will be reset to zero\n\nThis cannot be undone.")) return;
    try {
      await api.delete("/auth/database/reset-all");
      window.location.reload();
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not reset data.");
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Super-admin Settings</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Manage users, access roles, database backups, and activity.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card sx={{ maxWidth: 1100 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>User management</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Passwords are stored securely and cannot be displayed. Use Reset password to set a new one.</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
            <TextField size="small" label="Username" value={newUsername} onChange={(event) => setNewUsername(event.target.value)} />
            <TextField size="small" label="Initial password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>Role</InputLabel><Select value={newRole} label="Role" onChange={(event) => setNewRole(event.target.value)}>{roles.map((role: any) => <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>)}</Select></FormControl>
            <Button variant="contained" onClick={createManagedUser} disabled={createUser.isPending || !newUsername || newPassword.length < 8}>Create user</Button>
          </Box>
          <Table size="small">
            <TableHead><TableRow><TableCell>Username</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Last login</TableCell><TableCell>Last activity</TableCell><TableCell>Password</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>{users.map((managedUser: any) => <TableRow key={managedUser.id}><TableCell>{managedUser.username}</TableCell><TableCell>{roles.find((role: any) => role.value === managedUser.role)?.label || managedUser.role}</TableCell><TableCell>{managedUser.is_active ? "Active" : "Inactive"}</TableCell><TableCell>{managedUser.last_login_at ? new Date(managedUser.last_login_at).toLocaleString() : "Never"}</TableCell><TableCell>{managedUser.last_activity_at ? new Date(managedUser.last_activity_at).toLocaleString() : "Never"}</TableCell><TableCell>Hidden</TableCell><TableCell><Button size="small" onClick={() => setResetUserId(managedUser.id)}>Reset password</Button>{managedUser.id !== user?.id && <Button size="small" onClick={() => updateUser.mutate({ id: managedUser.id, is_active: !managedUser.is_active })}>{managedUser.is_active ? "Deactivate" : "Activate"}</Button>}</TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card sx={{ maxWidth: 1100, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Database administration</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" onClick={downloadBackup}>Download full backup</Button>
            <Button variant="outlined" component="label">Restore database<input hidden type="file" accept=".db,.sqlite" onChange={restoreBackup} /></Button>
            <Button color="warning" variant="outlined" onClick={resetAllData}>Reset all data</Button>
            <Button color="error" variant="outlined" onClick={clearDatabase}>Delete everything</Button>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ maxWidth: 1100, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>User activity</Typography>
          <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Time</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>Details</TableCell></TableRow></TableHead><TableBody>{visibleActivities.map((activity: any) => <TableRow key={activity.id}><TableCell>{new Date(activity.created_at).toLocaleString()}</TableCell><TableCell>{activity.username}</TableCell><TableCell>{activity.action}</TableCell><TableCell>{activity.details || "—"}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
          {hasMoreActivities && <Box sx={{ mt: 1, textAlign: "center" }}><Button size="small" onClick={() => setShowCount((c) => Math.min(c + 20, activities.length))} sx={{ fontSize: "0.75rem" }}>Show more ({activities.length - showCount} remaining)</Button></Box>}
        </CardContent>
      </Card>
      {resetUserId && <Card sx={{ maxWidth: 420, mt: 3 }}><CardContent><Typography variant="h6">Reset password</Typography><TextField fullWidth margin="dense" label="New password" type="password" value={resetValue} onChange={(event) => setResetValue(event.target.value)} /><Box sx={{ display: "flex", gap: 1, mt: 1 }}><Button onClick={() => setResetUserId(null)}>Cancel</Button><Button variant="contained" onClick={resetManagedPassword} disabled={resetValue.length < 8 || resetPassword.isPending}>Save password</Button></Box></CardContent></Card>}
    </Box>
  );
};
