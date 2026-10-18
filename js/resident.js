function openScannerModal() {
    document.getElementById("modal-guard-scanner").classList.remove("hidden");
}

function simulateScanSuccess() {
    closeModal("modal-guard-scanner");

    let targetParcel = null;
    for (let p of parcels) {
        if (p.overallStatus === 'confirmed' || p.overallStatus === 'pending') {
            targetParcel = p;
            break;
        }
    }

    if (!targetParcel) {
        showToast("ℹ️ ไม่พบพัสดุที่รอการสแกนรับในขณะนี้", "info");
        return;
    }

    let completedCount = 0;
    targetParcel.items.forEach(item => {
        if (item.status !== 'canceled') {
            item.status = 'completed';
            completedCount++;
        }
    });

    targetParcel.overallStatus = 'completed';

    addAuditLog("PARCEL_DELIVERED", `รปภ. สแกน QR Code ครั้งเดียว ส่งมอบพัสดุ ${targetParcel.id} (รวม ${completedCount} ชิ้น) แก่ลูกห้อง ${targetParcel.room}`, "รปภ.");
    saveData(); 
    renderAllViews();

    showLinePopup(`🚚 พัสดุส่งมอบสำเร็จ (สแกนครั้งเดียว)!\nรปภ. สแกน QR Code ส่งมอบพัสดุ ${targetParcel.id} (รวม ${completedCount} ชิ้น) ให้แก่ลูกห้อง ${targetParcel.room} เรียบร้อยแล้ว`);
    showToast(`🎉 สแกน QR Code สำเร็จ! ส่งมอบพัสดุ ${targetParcel.id} (รวม ${completedCount} ชิ้น) เรียบร้อยแล้ว`, "success");
}
