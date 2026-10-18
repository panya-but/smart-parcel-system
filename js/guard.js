function updateRoomOptions() {
    const building = document.getElementById("intake-building").value;
    const select = document.getElementById("intake-room");
    if (!select) return;

    // ดึงเฉพาะห้องพักที่ลงทะเบียนไว้แล้วของตึกนั้นๆ
    const filteredUsers = users.filter(u => u.building === building && u.role === 'resident');
    
    if (filteredUsers.length === 0) {
        select.innerHTML = `<option value="101">101 (ลูกห้องตัวอย่าง)</option>`;
    } else {
        select.innerHTML = filteredUsers.map(u => `<option value="${u.room}">${u.room} (${u.name})</option>`).join("");
    }
}

function setItemCount(count) {
    document.getElementById("intake-item-count").value = count;
    renderItemPhotoDropzones();
}

function renderItemPhotoDropzones() {
    const qty = Math.max(1, Math.min(10, parseInt(document.getElementById("intake-item-count").value || 1)));
    const container = document.getElementById("dynamic-photos-container");
    if (!container) return;
    intakeUploadedPhotos = {};

    let html = "";
    for (let i = 0; i < qty; i++) {
        html += `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-700">📦 พัสดุชิ้นที่ ${i+1}</span>
                    <span class="text-[10px] text-slate-400">รูปภาพ 1 รูปต่อชิ้น</span>
                </div>
                <div class="flex items-center gap-3">
                    <div id="preview-box-${i}" class="w-16 h-16 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 overflow-hidden relative flex-shrink-0">
                        <i class="fa-solid fa-camera text-slate-300"></i>
                    </div>
                    <div class="flex-grow space-y-1">
                        <input type="file" accept="image/*" onchange="handleFileSelect(event, ${i})" class="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100">
                        <button type="button" onclick="setMockPhotoForIndex(${i})" class="text-[10px] text-brand-600 hover:underline">
                            <i class="fa-solid fa-wand-magic"></i> ใส่ภาพตัวอย่างชิ้นนี้
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function handleFileSelect(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        compressImage(e.target.result, 400, 0.6, function(compressedData) {
            intakeUploadedPhotos[index] = compressedData;
            const previewBox = document.getElementById(`preview-box-${index}`);
            if (previewBox) previewBox.innerHTML = `<img src="${compressedData}" class="w-full h-full object-cover">`;
        });
    };
    reader.readAsDataURL(file);
}

function setMockPhotoForIndex(index) {
    intakeUploadedPhotos[index] = MOCK_BOX_PHOTO;
    const previewBox = document.getElementById(`preview-box-${index}`);
    if (previewBox) previewBox.innerHTML = `<img src="${MOCK_BOX_PHOTO}" class="w-full h-full object-cover">`;
}

function fillMockAllPhotos() {
    const qty = Math.max(1, Math.min(10, parseInt(document.getElementById("intake-item-count").value || 1)));
    for (let i = 0; i < qty; i++) setMockPhotoForIndex(i);
    showToast("✨ ใส่รูปถ่ายตัวอย่างเรียบร้อยทุกชิ้น", "info");
}

function compressImage(base64Str, maxWidth, quality, callback) {
    const img = new Image();
    img.src = base64Str;
    img.onload = function() {
        const canvas = document.createElement("canvas");
        let width = img.width, height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg", quality));
    };
}

function handleParcelIntake(e) {
    e.preventDefault();
    const building = document.getElementById("intake-building").value;
    const room = document.getElementById("intake-room").value;
    const datetime = document.getElementById("intake-datetime").value;
    const note = document.getElementById("intake-note").value || "-";
    const qty = Math.max(1, Math.min(10, parseInt(document.getElementById("intake-item-count").value || 1)));

    let items = [];
    for (let i = 0; i < qty; i++) {
        items.push({ no: i + 1, photo: intakeUploadedPhotos[i] || MOCK_BOX_PHOTO, status: "pending" });
    }

    const parcelId = "PK-" + Math.floor(1000 + Math.random() * 9000);
    const newParcel = { id: parcelId, building, room, datetime, note, overallStatus: "pending", items };

    parcels.unshift(newParcel);
    addAuditLog("PARCEL_INTAKE", `รปภ. บันทึกรับพัสดุ ${parcelId} จำนวน ${qty} ชิ้น เข้า ${building} ห้อง ${room}`, "รปภ.");
    saveData();
    renderAllViews();

    showLinePopup(`📦 มีพัสดุใหม่ถึงตึกแล้ว!\nสถานที่: ${building} - ห้อง ${room}\nรหัส: ${parcelId} (รวม ${qty} ชิ้น)\nโปรดตรวจรูปและเปิด QR เพื่อสแกนรับ`);
    showToast(`✅ บันทึกพัสดุ ${parcelId} สำเร็จ! แจ้งเตือนไปยัง LINE ลูกห้องเรียบร้อย`, "success");

    document.getElementById("intake-note").value = "";
    document.getElementById("intake-item-count").value = 1;
    renderItemPhotoDropzones();
}

function renderGuardParcelTable() {
    const tbody = document.getElementById("guard-parcel-table-body");
    if (!tbody) return;
    const search = (document.getElementById("guard-search-input")?.value || "").toLowerCase();
    const filter = document.getElementById("guard-status-filter")?.value || "all";

    let filtered = parcels.filter(p => {
        const matchSearch = p.id.toLowerCase().includes(search) || p.room.toLowerCase().includes(search) || p.building.toLowerCase().includes(search);
        const matchStatus = filter === 'all' || p.overallStatus === filter;
        return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-3 py-6 text-center text-slate-400">ไม่พบรายการพัสดุ</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-3 py-3">
                <p class="font-bold text-slate-800">${p.id}</p>
                <p class="text-[10px] text-slate-400">${p.datetime.replace('T', ' ')}</p>
            </td>
            <td class="px-3 py-3">
                <p class="font-semibold text-slate-700">${p.building} - ${p.room}</p>
                <p class="text-[10px] text-slate-400">${p.items.length} ชิ้น (${p.note})</p>
            </td>
            <td class="px-3 py-3 text-center">
                <div class="flex items-center justify-center -space-x-2">
                    ${p.items.map(item => `
                        <div onclick="openImageZoom('${item.photo || ''}')" class="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 overflow-hidden shadow-sm cursor-pointer hover:scale-110 transition-transform">
                            ${item.photo ? `<img src="${item.photo}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-[8px] text-slate-400">ลบแล้ว</div>`}
                        </div>
                    `).join('')}
                </div>
            </td>
            <td class="px-3 py-3 text-center">${getStatusBadge(p.overallStatus)}</td>
            <td class="px-3 py-3 text-right">
                ${(p.overallStatus === 'confirmed' || p.overallStatus === 'pending') ? `
                    <button onclick="openScannerModal()" class="bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                        <i class="fa-solid fa-qrcode mr-1"></i> สแกนรับ (ครั้งเดียว)
                    </button>
                ` : `<span class="text-slate-400 text-[11px]">-</span>`}
            </td>
        </tr>
    `).join('');
}

function triggerGuardCancelAlert(building, room, parcelId, pieceNo) {
    const banner = document.getElementById("guard-cancel-alert-banner");
    const details = document.getElementById("cancel-alert-details");
    if (banner && details) {
        details.textContent = `พัสดุรหัส ${parcelId} (ชิ้นที่ ${pieceNo}) สำหรับ ${building} - ห้อง ${room} ถูกระบุว่าไม่ใช่ของลูกห้อง`;
        banner.classList.remove("hidden");
    }
}

function dismissCancelAlert() {
    const banner = document.getElementById("guard-cancel-alert-banner");
    if (banner) banner.classList.add("hidden");
}