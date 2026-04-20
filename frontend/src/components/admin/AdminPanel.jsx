import ProductForm from './ProductForm.jsx'
import UserManagement from './UserManagement.jsx'

function AdminPanel({ users = [], onAddProduct, onToggleUserStatus }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-3 text-xl font-bold">Admin Panel</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <ProductForm onSubmit={onAddProduct} />
        <UserManagement users={users} onToggleUserStatus={onToggleUserStatus} />
      </div>
    </section>
  )
}

export default AdminPanel
