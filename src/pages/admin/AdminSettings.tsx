import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';

const AdminSettings = () => {
  const { user } = useAuth();

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Email</label>
              <p className="text-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Role</label>
              <span className="inline-flex px-2 py-1 bg-primary/20 text-primary rounded text-sm">
                Admin
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Platform Settings</h2>
          <p className="text-muted-foreground text-sm">
            Platform configuration and advanced settings will be available in future updates.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
