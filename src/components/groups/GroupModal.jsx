import React, { useState } from 'react';
import { groupService } from '../../services/api';
import { X, Users, UserPlus, Trash2, Crown, User, PlusCircle, CheckCircle2 } from 'lucide-react';

export const GroupModal = ({
  isOpen,
  onClose,
  currentGroup,
  groups,
  currentUser,
  onGroupCreated,
  onMemberUpdated,
}) => {
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'create'
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  // Determine if current user is owner of the active group
  const isOwner = currentGroup?.users?.some(
    (u) => u.id === currentUser?.id && u.pivot?.role === 'owner'
  ) || currentGroup?.pivot?.role === 'owner';

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await groupService.createGroup(newGroupName.trim());
      setNewGroupName('');
      setSuccess('Grup baru berhasil dibuat!');
      if (onGroupCreated) onGroupCreated(res.group);
      setTimeout(() => {
        setActiveTab('members');
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat grup baru.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentGroup) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await groupService.inviteMember(currentGroup.id, inviteEmail.trim());
      setInviteEmail('');
      setSuccess('Anggota berhasil diundang ke grup!');
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengundang anggota.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin mengeluarkan anggota ini?')) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await groupService.removeMember(currentGroup.id, userId);
      setSuccess('Anggota berhasil dihapus dari grup.');
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus anggota.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-sm rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-4 animate-scaleUp"
        style={{ backgroundColor: 'var(--bg-color, #ffffff)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: 'var(--primary-color, #003049)' }}
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Kelola Dompet Bersama</h2>
              <p className="text-[11px] text-slate-500">Grup: {currentGroup?.name || 'Pilih Grup'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('members'); setError(''); setSuccess(''); }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              activeTab === 'members'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Anggota Grup
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('create'); setError(''); setSuccess(''); }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              activeTab === 'create'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Buat Grup Baru
          </button>
        </div>

        {/* Feedback alert */}
        {error && (
          <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-2.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'members' ? (
          <div className="space-y-4">
            {/* Invite Form (Owner Only) */}
            {isOwner ? (
              <form onSubmit={handleInvite} className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Undang Anggota via Email</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="email.anggota@gmail.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: 'var(--primary-color, #003049)' }}
                    className="px-3 py-1.5 rounded-xl text-white text-xs font-medium hover:opacity-95 disabled:opacity-50 transition-opacity shadow-sm"
                  >
                    Undang
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                Hanya <strong>Owner</strong> yang dapat mengundang atau mengeluarkan anggota grup.
              </div>
            )}

            {/* Member List */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Daftar Anggota Saat Ini</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentGroup?.users && currentGroup.users.length > 0 ? (
                  currentGroup.users.map((member) => {
                    const memberRole = member.pivot?.role || 'member';
                    const isMemberOwner = memberRole === 'owner';
                    return (
                      <div
                        key={member.id}
                        className="p-2.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: isMemberOwner ? 'var(--primary-color, #003049)' : 'var(--secondary-color, #669bbc)' }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                              {member.name}
                              {member.id === currentUser?.id && (
                                <span className="text-[10px] text-slate-400 font-normal">(Anda)</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                            isMemberOwner 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isMemberOwner ? (
                              <>
                                <Crown className="w-2.5 h-2.5" />
                                <span>Owner</span>
                              </>
                            ) : (
                              <>
                                <User className="w-2.5 h-2.5" />
                                <span>Member</span>
                              </>
                            )}
                          </span>

                          {/* Delete Member (Owner can remove non-owners) */}
                          {isOwner && !isMemberOwner && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={loading}
                              title="Hapus anggota"
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-3 text-xs text-slate-400">Belum ada data anggota.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Nama Grup / Dompet Bersama</label>
              <input
                type="text"
                required
                placeholder="Misal: Tabungan Liburan, Usaha Bersama"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500">
                Anda akan otomatis menjadi <strong>Owner</strong> dari grup yang baru dibuat.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !newGroupName.trim()}
              style={{ backgroundColor: 'var(--primary-color, #003049)' }}
              className="w-full py-2 rounded-xl text-white text-xs font-medium shadow-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Membuat...' : 'Buat Grup'}</span>
            </button>
          </form>
        )}

        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
