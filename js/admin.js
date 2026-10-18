function addAuditLog(action, details, by) {
    auditLogs.unshift({ id: Date.now(), action, details, by, time: new Date().toLocaleString("th-TH") });
    if (auditLogs.length > 50) auditLogs.pop();
}

function autoCleanupExpiredPhotos() {
    const RETENTION_DAYS = 30;
    const now = Date.now();
    const thirtyDaysMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    parcels.forEach(p => {
        const pTime = new Date(p.datetime || Date.now()).getTime();
        if ((now - pTime) >= thirtyDaysMs) {
            p.items.forEach(item => {
                if (item.photo) { delete item.photo; item.photo = null; deletedCount++; }
            });
        }
    });

    if (deletedCount > 0) {
        saveData();
        addAuditLog("PDPA_CLEANUP", `ระบบลบรูปถ่ายพัสดุอัตโนมัติรวม ${deletedCount} รูป (อายุเกิน 30 วันตามกฎ PDPA)`, "ระบบอัตโนมัติ");
    }
    return deletedCount;
}

function triggerManualCleanup() {
    const count = autoCleanupExpiredPhotos();
    renderAllViews();
    if (count === 0) showToast("ℹ️ ไม่พบรูปถ่ายพัสดุที่มีอายุเกิน 30 วันในระบบ", "info");
    else showToast(`🧹 ลบรูปถ่ายพัสดุเก่าเกิน 30 วันเรียบร้อยแล้ว (${count} รูป)`, "success");
}

function renderPendingUsersTable() {
    const tbody = document.getElementById("admin-pending-users-tbody");
    const badgeCount = document.getElementById("stat-pending-users-count");
    if (!tbody) return;

    const pendingUsers = users.filter(u => u.status === 'pending');
    if (badgeCount) badgeCount.textContent = pendingUsers.length;

    if (pendingUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-3 py-6 text-center text-slate-400 font-medium">✨ ไม่มีรายการสมัครสมาชิกที่รอการอนุมัติในขณะนี้</td></tr>`;
        return;
    }

    tbody.innerHTML = pendingUsers.map(u => `
        <tr class="hover:bg-amber-50/50 transition-colors">
            <td class="px-3 py-3">
                <p class="font-bold text-slate-800">${u.name}</p>
                <p class="text-[10px] text-slate-400">ไอดี: ${u.userId} | ลงทะเบียน: ${u.regDate || '-'}</p>
            </td>
            <td class="px-3 py-3 font-semibold">
                ${u.role === 'resident' ? `<span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px]">🏠 ลูกห้อง (${u.building} -${u.room})</span>` : `<span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px]">👮 เจ้าหน้าที่ รปภ.</span>`}
            </td>
            <td class="px-3 py-3 text-slate-500 text-xs">${u.provider === 'line' ? '💬 LINE' : '📧 อีเมล'} (${u.email || '-'})</td>
            <td class="px-3 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">⏳ รออนุมัติ</span></td>
            <td class="px-3 py-3 text-right space-x-1">
                <button onclick="approveUser('${u.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    ✅ อนุมัติ
                </button>
                <button onclick="rejectUser('${u.id}')" class="bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    ❌ ปฏิเสธ
                </button>
            </td>
        </tr>
    `).join('');
}

function approveUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    user.status = 'approved';
    saveData();
    updateRoomOptions();
    renderAllViews();

    showToast(`✅ อนุมัติผู้ใช้ ${user.name} เรียบร้อยแล้ว! สามารถเข้าสู่ระบบได้ทันที`, "success");
    addAuditLog("USER_APPROVE", `นิติบุคคลอนุมัติบัญชีใช้งานให้ ${user.name} (${user.role})`, "นิติบุคคล");
}

function rejectUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`คุณต้องการปฏิเสธคำขอสมัครของ ${user.name} ใช่หรือไม่?`)) return;

    user.status = 'rejected';
    saveData();
    renderAllViews();

    showToast(`❌ ปฏิเสธคำขอสมัครของ ${user.name} เรียบร้อยแล้ว`, "info");
    addAuditLog("USER_REJECT", `นิติบุคคลปฏิเสธบัญชีใช้งานของ ${user.name}`, "นิติบุคคล");
}

function renderUserManagementTable() {
    const tbody = document.getElementById("admin-all-users-tbody");
    if (!tbody) return;

    const search = (document.getElementById("admin-user-search-input")?.value || "").toLowerCase();
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search) || 
        u.room.toLowerCase().includes(search) || 
        u.userId.toLowerCase().includes(search) ||
        u.building.toLowerCase().includes(search)
    );

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-3 py-6 text-center text-slate-400">ไม่พบรายชื่อผู้ใช้งาน</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredUsers.map(u => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-3 py-3">
                <p class="font-bold text-slate-800">${u.name}</p>
                <p class="text-[10px] text-slate-400">ไอดี: ${u.userId} | อีเมล: ${u.email}</p>
            </td>
            <td class="px-3 py-3 font-semibold text-slate-700">${u.building} - ${u.room}</td>
            <td class="px-3 py-3">
                ${u.role === 'admin' ? '<span class="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">👑 แอดมิน/นิติ</span>' : u.role === 'guard' ? '<span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">👮 รปภ.</span>' : '<span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">🏠 ลูกห้อง</span>'}
            </td>
            <td class="px-3 py-3 text-center">
                ${u.status === 'approved' ? '<span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">อนุมัติแล้ว</span>' : u.status === 'pending' ? '<span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">รออนุมัติ</span>' : '<span class="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-800 font-bold">ไม่อนุมัติ</span>'}
            </td>
            <td class="px-3 py-3 text-slate-400 text-[11px]">${u.regDate || '-'}</td>
            <td class="px-3 py-3 text-right">
                ${u.role !== 'admin' ? `
                    <button onclick="deleteUserAccount('${u.id}')" class="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-all" title="ลบไอดีผู้ย้ายออก">
                        <i class="fa-solid fa-user-xmark mr-1"></i> ลบไอดี (ย้ายออก)
                    </button>
                ` : '<span class="text-[10px] text-slate-400">-</span>'}
            </td>
        </tr>
    `).join('');
}

function deleteUserAccount(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`⚠️ ยืนยันการลบไอดีและข้อมูลผู้ใช้ "${user.name}" (${user.building} ห้อง ${user.room}) ออกจากระบบหรือไม่?\n\n(ใช้สำหรับกรณีลูกห้องย้ายออก หรือเจ้าหน้าที่ลาออก)`)) return;

    users = users.filter(u => u.id !== userId);

    if (user.role === 'resident') {
        const deletedParcels = parcels.filter(p => p.building === user.building && p.room === user.room);
        parcels = parcels.filter(p => !(p.building === user.building && p.room === user.room));
        if (deletedParcels.length > 0) {
            addAuditLog("PARCEL_CLEAR", `ลบพัสดุตกค้างจำนวน ${deletedParcels.length} รายการของ ${user.building} ห้อง ${user.room} เนื่องจากลูกห้องย้ายออก`, "นิติบุคคล");
        }
    }

    saveData();
    updateRoomOptions();
    renderAllViews();

    showToast(`🗑️ ลบไอดีและข้อมูลของ "${user.name}" เรียบร้อยแล้ว`, "info");
    addAuditLog("USER_DELETE", `นิติบุคคลลบไอดีผู้ใช้ย้ายออก: ${user.name} (${user.building} ห้อง ${user.room})`, "นิติบุคคล");
}

function renderAdminTable() {
    const tbody = document.getElementById("admin-parcel-table-body");
    if (!tbody) return;
    const search = (document.getElementById("admin-search-input")?.value || "").toLowerCase();

    let filtered = parcels.filter(p => p.id.toLowerCase().includes(search) || p.room.toLowerCase().includes(search));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-3 py-6 text-center text-slate-400">ไม่พบข้อมูลพัสดุ</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-3 py-3 font-bold text-slate-800">${p.id}</td>
            <td class="px-3 py-3 font-semibold">${p.building} - ${p.room}</td>
            <td class="px-3 py-3 text-slate-500">${p.datetime.replace('T', ' ')}</td>
            <td class="px-3 py-3 text-center">${p.items.length} ชิ้น</td>
            <td class="px-3 py-3 text-center">${getStatusBadge(p.overallStatus)}</td>
            <td class="px-3 py-3 text-right">
                <button onclick="deleteParcel('${p.id}')" class="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg">
                    <i class="fa-solid fa-trash mr-1"></i> ลบ
                </button>
            </td>
        </tr>
    `).join('');
}

function deleteParcel(id) {
    if (!confirm(`คุณต้องการลบพัสดุรหัส ${id} ออกจากระบบใช่หรือไม่?`)) return;
    parcels = parcels.filter(p => p.id !== id);
    addAuditLog("PARCEL_DELETE", `แอดมินลบพัสดุรหัส ${id} ออกจากระบบ`, "แอดมิน");
    saveData(); renderAllViews();
    showToast(`🗑️ ลบพัสดุรหัส ${id} เรียบร้อยแล้ว`, "info");
}

function renderAuditLogs() {
    const container = document.getElementById("audit-logs-container");
    if (!container) return;
    container.innerHTML = auditLogs.map(l => `
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
                <span class="font-bold text-slate-700 mr-2">[${l.action}]</span>
                <span class="text-slate-600">${l.details}</span>
            </div>
            <div class="text-[10px] text-slate-400 text-right">
                <span>โดย: ${l.by}</span> · <span>${l.time}</span>
            </div>
        </div>
    `).join('');
}
