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