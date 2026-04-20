import React from 'react';
import Button from '../common/Button.jsx';

function UserManagement({ users = [], onToggleUserStatus }) {
  return (
    <div className="flex flex-col gap-3">
      {users.length === 0 ? (
        <p className="text-sm text-on-surface-variant font-body">No users available.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-container-highest bg-surface-container-low px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-on-surface font-body">
                  {user.name || user.full_name}
                </p>
                <p className="text-xs text-on-surface-variant font-body">{user.email}</p>
              </div>
              <Button
                size="sm"
                variant={user.is_admin ? 'secondary' : 'danger'}
                onClick={() => onToggleUserStatus?.(user.id)}
              >
                {user.is_admin ? 'Remove Admin' : 'Make Admin'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserManagement;
