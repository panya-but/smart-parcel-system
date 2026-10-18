function renderResidentCards() {
    const container = document.getElementById("resident-cards-container");
    if (!container) return;

    if (!currentUser || currentUser.role !== 'resident') return;

    document.getElementById("resident-room-title").textContent = `${currentUser.building} - ห้อง ${currentUser.room}`;
    document.getElementById("resident-name-title").textContent = `ผู้ใช้งาน: ${currentUser.name} (${currentUser.provider === 'line' ? 'เข้าผ่าน LINE' : 'ไอดี: ' + currentUser.userId})`;

    // กรองแสดงพัสดุเฉพาะตึกและเลขห้องของไอดีที่เข้าสู่ระบบเท่านั้น
    const myParcels = parcels.filter(p => p.building === currentUser.building && p.room === currentUser.room);

    if (myParcels.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                <i class="fa-solid fa-box-open text-4xl text-slate-300"></i>
                <p class="text-sm font-semibold">ไม่มีรายการพัสดุสำหรับห้องของคุณ (${currentUser.building} ห้อง ${currentUser.room}) ในขณะนี้</p>
            </div>
        `;
        return;
    }

    container.innerHTML = myParcels.map(p => {
        const activeItemsCount = p.items.filter(i => i.status !== 'canceled').length;
        const isReadyForPickup = (p.overallStatus === 'confirmed' || p.overallStatus === 'pending') && activeItemsCount > 0;

        return `
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-slate-800">${p.id}</span>
                            <span class="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">รวม ${p.items.length} ชิ้น</span>
                        </div>
                        <p class="text-[11px] text-slate-400 mt-0.5">รับเข้าเมื่อ: ${p.datetime.replace('T', ' ')} (${p.note})</p>
                    </div>

                    <div class="flex items-center gap-2">
                        ${getStatusBadge(p.overallStatus)}
                        ${isReadyForPickup ? `
                            <button onclick="showResidentQR('${p.id}')" class="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-1.5 transition-all">
                                <i class="fa-solid fa-qrcode text-emerald-300"></i>
                                <span>แสดง QR รับพัสดุรวม (${activeItemsCount} ชิ้น)</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${p.items.map(item => `
                        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-slate-700">📦 ชิ้นที่ ${item.no} / ${p.items.length}</span>${getItemStatusBadge(item.status)}
                                </div>
                                <div onclick="openImageZoom('${item.photo || ''}')" class="h-32 bg-slate-200 rounded-lg overflow-hidden relative cursor-pointer group">
                                    ${item.photo ? `
                                        <img src="${item.photo}" class="w-full h-full object-cover">
                                        <div class="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold">
                                            <i class="fa-solid fa-magnifying-glass-plus mr-1"></i> ดูรูปขยาย
                                        </div>
                                    ` : `
                                        <div class="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center">
                                            <i class="fa-solid fa-shield-cat text-2xl mb-1"></i>
                                            <span>รูปถูกลบตามนโยบาย PDPA</span>
                                        </div>
                                    `}
                                </div>
                            </div>

                            <div class="space-y-1 pt-1">
                                ${item.status === 'pending' ? `
                                    <button onclick="confirmPiece('${p.id}', ${item.no})" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 rounded-lg shadow-sm">
                                        ✅ ยืนยันสภาพชิ้นนี้
                                    </button>
                                    <button onclick="cancelPiece('${p.id}', ${item.no})" class="w-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-1 rounded-lg">
                                        ❌ ไม่ใช่ของฉัน (ยกเลิก)
                                    </button>
                                ` : item.status === 'confirmed' ? `
                                    <div class="text-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 py-1 rounded-lg border border-emerald-200">
                                        ✅ ยืนยันแล้ว (พร้อมสแกนรับรวม)
                                    </div>
                                ` : item.status === 'completed' ? `
                                    <div class="text-center text-[11px] font-semibold text-slate-500 py-1">
                                        🚚 รับเรียบร้อยแล้ว
                                    </div>
                                ` : `
                                    <div class="text-center text-[11px] font-semibold text-red-500 py-1">
                                        ❌ ยกเลิก/ปฏิเสธแล้ว
                                    </div>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function confirmPiece(parcelId, pieceNo) {
    const p = parcels.find(x => x.id === parcelId); if (!p) return;
    const item = p.items.find(x => x.no === pieceNo); if (!item) return;

    item.status = 'confirmed';
    updateOverallStatus(p);
    addAuditLog("PIECE_CONFIRMED", `ลูกห้อง ${p.room} ยืนยันสภาพพัสดุ ${parcelId} ชิ้นที่ ${pieceNo}`, "ลูกห้อง");
    saveData(); renderAllViews();

    showToast(`✅ ยืนยันสภาพพัสดุชิ้นที่ ${pieceNo} เรียบร้อย! สามารถแสดง QR Code รวม เพื่อรับพัสดุได้ทันที`, "success");
}

function cancelPiece(parcelId, pieceNo) {
    const p = parcels.find(x => x.id === parcelId); if (!p) return;
    const item = p.items.find(x => x.no === pieceNo); if (!item) return;

    item.status = 'canceled';
    updateOverallStatus(p);
    addAuditLog("PIECE_CANCELED", `🚨 URGENT: ลูกห้อง ${p.room} ปฏิเสธพัสดุ ${parcelId} ชิ้นที่ ${pieceNo}`, "ลูกห้อง");
    saveData(); renderAllViews();

    triggerGuardCancelAlert(p.building, p.room, parcelId, pieceNo);
    showLinePopup(`🚨 URGENT ALERT ถึง รปภ.!\nลูกห้อง ${p.building} ห้อง ${p.room} กดปฏิเสธพัสดุ ${parcelId} (#${pieceNo})\nโปรดนำออกจากจุดเก็บพัสดุทันที`);
    showToast(`⚠️ แจ้ง รปภ. เรียบร้อยแล้วว่าพัสดุชิ้นนี้ไม่ใช่ของคุณ`, "info");
}

function updateOverallStatus(p) {
    if (p.items.every(i => i.status === 'canceled')) p.overallStatus = 'canceled';
    else if (p.items.every(i => i.status === 'completed' || i.status === 'canceled')) p.overallStatus = 'completed';
    else if (p.items.some(i => i.status === 'confirmed')) p.overallStatus = 'confirmed';
    else p.overallStatus = 'pending';
}

function showResidentQR(parcelId) {
    const p = parcels.find(x => x.id === parcelId);
    if (!p) return;

    const activeCount = p.items.filter(i => i.status !== 'canceled').length;
    const qrCanvas = document.getElementById("qrcode-canvas");
    qrCanvas.innerHTML = "";

    const codeText = `RCV-${parcelId}`;
    document.getElementById("qr-modal-code").textContent = `${codeText} (สแกนรับครั้งเดียวรวม ${activeCount} ชิ้น)`;
    document.getElementById("qr-modal-title").textContent = `QR Code รับพัสดุรวม (${parcelId})`;

    new QRCode(qrCanvas, { text: codeText, width: 160, height: 160 });
    document.getElementById("modal-resident-qr").classList.remove("hidden");
}