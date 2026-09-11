import { Alert, Box, Button, Card, CardContent, CircularProgress, Collapse, FormControl, IconButton, InputLabel, MenuItem, Select, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { ChangeEvent, Fragment, useState } from "react";
import { useAuthActivities, useAppSettings, useUpdateAppSetting, useAuthRoles, useAuthUsers, useCreateAuthUser, useResetAuthPassword, useUpdateAuthUser } from "../hooks/useApi";
import { ConfirmDialog, EmptyState, PageHeader, TableSkeleton } from "../components/ui";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";

export const Settings = () => {
  const { user } = useAuth();
  const { data: users = [], isLoading: usersLoading } = useAuthUsers(user?.role === "super_admin");
  const { data: roles = [], isLoading: rolesLoading } = useAuthRoles(user?.role === "super_admin");
  const { data: activities = [], isLoading: activitiesLoading } = useAuthActivities(user?.role === "super_admin");
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
  const [busy, setBusy] = useState<null | "backup" | "restore" | "clear" | "reset" | "toggle">(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const toggleActive = async (managedUser: any) => {
    if (busy) return;
    setBusy("toggle");
    setTogglingId(managedUser.id);
    try {
      await updateUser.mutateAsync({ id: managedUser.id, is_active: !managedUser.is_active });
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not update user.");
    } finally {
      setBusy(null);
      setTogglingId(null);
    }
  };

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
    if (busy) return;
    setBusy("backup");
    try {
      const response = await api.get("/backup/download", { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "recipe-inventory-backup.db";
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not download backup.");
    } finally {
      setBusy(null);
    }
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || busy) return;
    setBusy("restore");
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post("/backup/restore", form);
      window.location.reload();
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not restore database.");
      setBusy(null);
    }
  };

  const clearDatabase = async () => {
    if (busy) return;
    setBusy("clear");
    try {
      await api.delete("/auth/database", { params: { confirm: "DELETE" } });
      window.location.reload();
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not clear database.");
      setBusy(null);
    }
  };

  const resetAllData = async () => {
    if (busy) return;
    setBusy("reset");
    try {
      await api.delete("/auth/database/reset-all", { params: { confirm: "RESET" } });
      window.location.reload();
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not reset data.");
      setBusy(null);
    }
  };
  const [confirmAction, setConfirmAction] = useState<null | "clear" | "reset">(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const AppSettingsSection = () => {
    const { data: settings = [], isLoading: settingsLoading } = useAppSettings();
    const updateSetting = useUpdateAppSetting();
    const deleteEnabled = settings.find((s) => s.key === "inventory_delete_enabled")?.value === "true";

    const handleToggle = () => {
      updateSetting.mutateAsync({
        key: "inventory_delete_enabled",
        value: deleteEnabled ? "false" : "true",
        description: "Show delete action in inventory overflow menu",
      }).catch((e) => setError(e.response?.data?.detail || "Could not update setting."));
    };

    if (settingsLoading) return <CircularProgress size={20} />;

    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Inventory delete action</Typography>
          <Typography variant="caption" color="text.secondary">Show the Delete option in inventory item overflow menus (saleable, raw materials, packing materials).</Typography>
        </Box>
        <Switch checked={deleteEnabled} onChange={handleToggle} disabled={updateSetting.isPending} />
      </Box>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Super-admin Settings"
        subtitle="Manage users, access roles, database backups, and activity."
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card sx={{ maxWidth: 1100 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>User management</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Passwords are stored securely and cannot be displayed. Use Reset password to set a new one.</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
            <TextField size="small" label="Username" value={newUsername} onChange={(event) => setNewUsername(event.target.value)} />
            <TextField size="small" label="Initial password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <FormControl size="small" sx={{ minWidth: 190 }} disabled={rolesLoading}><InputLabel>{rolesLoading ? "Loading roles..." : "Role"}</InputLabel><Select value={newRole} label={rolesLoading ? "Loading roles..." : "Role"} onChange={(event) => setNewRole(event.target.value)}>{roles.map((role: any) => <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>)}</Select></FormControl>
            <Button variant="contained" onClick={createManagedUser} disabled={createUser.isPending || !newUsername || newPassword.length < 8}>Create user</Button>
          </Box>
          <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 560 }}>
            <TableHead><TableRow><TableCell sx={{ display: { xs: "table-cell", md: "none" }, width: 44 }} /><TableCell>Username</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Last login</TableCell><TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Last activity</TableCell><TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Password</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>{usersLoading ? <TableSkeleton rows={4} colSpan={8} /> : users.length ? users.map((managedUser: any) => (
            <Fragment key={managedUser.id}>
              <TableRow key={managedUser.id}><TableCell sx={{ display: { xs: "table-cell", md: "none" } }}><IconButton size="small" aria-label={expandedId === managedUser.id ? "Hide details" : "Show details"} onClick={() => setExpandedId(expandedId === managedUser.id ? null : managedUser.id)}>{expandedId === managedUser.id ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}</IconButton></TableCell><TableCell>{managedUser.username}</TableCell><TableCell>{roles.find((role: any) => role.value === managedUser.role)?.label || managedUser.role}</TableCell><TableCell>{managedUser.is_active ? "Active" : "Inactive"}</TableCell><TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{managedUser.last_login_at ? new Date(managedUser.last_login_at).toLocaleString() : "Never"}</TableCell><TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{managedUser.last_activity_at ? new Date(managedUser.last_activity_at).toLocaleString() : "Never"}</TableCell><TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Hidden</TableCell><TableCell><Button size="small" onClick={() => setResetUserId(managedUser.id)}>Reset password</Button>{managedUser.id !== user?.id && <Button size="small" onClick={() => toggleActive(managedUser)} disabled={busy === "toggle" && togglingId === managedUser.id}>{busy === "toggle" && togglingId === managedUser.id ? <CircularProgress size={14} /> : (managedUser.is_active ? "Deactivate" : "Activate")}</Button>}</TableCell></TableRow>
              <TableRow key={`${managedUser.id}-details`}><TableCell colSpan={8} sx={{ display: expandedId === managedUser.id ? { xs: "table-cell", md: "none" } : "none", py: 0, borderBottom: expandedId === managedUser.id ? undefined : 0 }}><Collapse in={expandedId === managedUser.id} timeout="auto" unmountOnExit><Box sx={{ py: 1 }}><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Last login: {managedUser.last_login_at ? new Date(managedUser.last_login_at).toLocaleString() : "Never"}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Last activity: {managedUser.last_activity_at ? new Date(managedUser.last_activity_at).toLocaleString() : "Never"}</Typography></Box></Collapse></TableCell></TableRow>
            </Fragment>)) : <TableRow><TableCell colSpan={8} align="center"><EmptyState title="No users found." /></TableCell></TableRow>}</TableBody>
          </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Card sx={{ maxWidth: 1100, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Database administration</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" onClick={downloadBackup} disabled={busy !== null}>{busy === "backup" ? <CircularProgress size={18} /> : "Download full backup"}</Button>
            <Button variant="outlined" component="label" disabled={busy !== null}>{busy === "restore" ? <CircularProgress size={18} /> : "Restore database"}<input hidden type="file" accept=".db,.sqlite" onChange={restoreBackup} /></Button>
            <Button color="warning" variant="outlined" onClick={() => setConfirmAction("reset")} disabled={busy !== null}>Reset all data</Button>
            <Button color="error" variant="outlined" onClick={() => setConfirmAction("clear")} disabled={busy !== null}>Delete everything</Button>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ maxWidth: 1100, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Feature toggles</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Control which actions are available across the application.</Typography>
          <AppSettingsSection />
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === "clear" ? "Delete all business data?" : "Reset all transactional data?"}
        message={
          confirmAction === "clear"
            ? "All business data will be permanently deleted. User accounts will be preserved. This cannot be undone."
            : "All sales, purchases, batches, orders and payments will be deleted. Items, suppliers, recipes and customers will be kept, and all quantities reset to zero. This cannot be undone."
        }
        confirmLabel={confirmAction === "clear" ? "Delete everything" : "Reset all data"}
        danger
        pending={busy === "clear" || busy === "reset"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => { if (confirmAction === "clear") clearDatabase(); else if (confirmAction === "reset") resetAllData(); }}
      />
      <Card sx={{ maxWidth: 1100, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>User activity</Typography>
          <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Time</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>Details</TableCell></TableRow></TableHead><TableBody>{activitiesLoading ? <TableSkeleton rows={4} colSpan={4} /> : visibleActivities.length ? visibleActivities.map((activity: any) => <TableRow key={activity.id}><TableCell>{new Date(activity.created_at).toLocaleString()}</TableCell><TableCell>{activity.username}</TableCell><TableCell>{activity.action}</TableCell><TableCell>{activity.details || "—"}</TableCell></TableRow>) : <TableRow><TableCell colSpan={4} align="center"><EmptyState title="No activity recorded." /></TableCell></TableRow>}</TableBody></Table></TableContainer>
          {hasMoreActivities && <Box sx={{ mt: 1, textAlign: "center" }}><Button size="small" onClick={() => setShowCount((c) => Math.min(c + 20, activities.length))} sx={{ fontSize: "0.75rem" }}>Show more ({activities.length - showCount} remaining)</Button></Box>}
        </CardContent>
      </Card>
      {resetUserId && <Card sx={{ maxWidth: 420, mt: 3 }}><CardContent><Typography variant="h6">Reset password</Typography><TextField fullWidth margin="dense" label="New password" type="password" value={resetValue} onChange={(event) => setResetValue(event.target.value)} /><Box sx={{ display: "flex", gap: 1, mt: 1 }}><Button onClick={() => setResetUserId(null)}>Cancel</Button><Button variant="contained" onClick={resetManagedPassword} disabled={resetValue.length < 8 || resetPassword.isPending}>Save password</Button></Box></CardContent></Card>}
    </Box>
  );
};
