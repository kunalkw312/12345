// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 01. FIREBASE ARCHITECTURE SETUP
// ==========================================
let db = null;

try {
    const firebaseConfig = {
        apiKey: "AIzaSyCuB2izaoYMfr-olS3ImYL7Vw1OqkhMR5U",
        authDomain: "qfy-leads-59c25.firebaseapp.com",
        databaseURL: "https://qfy-leads-59c25-default-rtdb.firebaseio.com",
        projectId: "qfy-leads-59c25",
        storageBucket: "qfy-leads-59c25.firebasestorage.app",
        messagingSenderId: "873319787899",
        appId: "1:873319787899:web:3285832f2b5cda967c21de",
        measurementId: "G-PQ108NT0YX"
    };

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase Initialization Error: ", error);
}

// Global Variables
let allPublishedLeads = [];
let currentCategoryFilter = 'All';
window.currentEditingLeadId = null;

// ==========================================
// 02. CORE APPLICATION ROUTING (SPA Engine)
// ==========================================
window.navigate = function (viewId) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    const isAdminView = (viewId === 'admin-login-view' || viewId === 'admin-dashboard-view');
    const mainHeader = document.getElementById('main-header');
    const mainFooter = document.getElementById('main-footer');
    
    if (mainHeader) mainHeader.style.display = isAdminView ? 'none' : 'flex';
    if (mainFooter) mainFooter.style.display = isAdminView ? 'none' : 'block';

    if (viewId === 'admin-dashboard-view') {
        if (sessionStorage.getItem('adminAuth') !== 'true') {
            window.navigate('admin-login-view');
            return;
        } else {
            window.switchAdminTab('dash');
        }
    }

    if (viewId === 'public-leads-view') {
        window.loadPublicLeads();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==========================================
// 03. PUBLIC VIEW CLIENT ACTIONS & LEAD PROCESSING
// ==========================================
window.submitContactForm = async function (e) {
    e.preventDefault();
    if (!db) return alert("Database connection error.");

    const form = e.target;
    const name = form.name?.value || form.querySelector('input[placeholder*="Name"]')?.value || '';
    const email = form.email?.value || form.querySelector('input[placeholder*="Email"]')?.value || '';
    const phone = form.phone?.value || form.querySelector('input[placeholder*="Phone"]')?.value || '';
    const message = form.message?.value || form.querySelector('textarea')?.value || '';

    const btn = form.querySelector('button');
    if (btn) btn.innerText = "Sending...";

    try {
        await addDoc(collection(db, "contact_submissions"), {
            name, email, phone, message,
            status: "NEW",
            timestamp: serverTimestamp()
        });
        alert("Your inquiry has been submitted successfully!");
        form.reset();
    } catch (error) {
        console.error(error);
        alert("Failed to submit request.");
    } finally {
        if (btn) btn.innerText = "Send Message";
    }
};

window.loadPublicLeads = async function () {
    const grid = document.getElementById('public-leads-grid');
    if (!grid) return;
    if (!db) return;

    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">Loading leads...</div>';

    try {
        const snap = await getDocs(collection(db, "published_leads"));
        allPublishedLeads = [];
        snap.forEach(doc => {
            allPublishedLeads.push(doc.data());
        });
        window.filterPublicLeads(); 
    } catch (e) {
        console.error(e);
    }
};

window.setLeadFilter = function (category) {
    currentCategoryFilter = category;
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if (btn.innerText.trim() === category) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    window.filterPublicLeads();
};

window.filterPublicLeads = function () {
    const grid = document.getElementById('public-leads-grid');
    if (!grid) return;

    const searchInput = document.getElementById('lead-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    let filteredLeads = allPublishedLeads.filter(lead => {
        const matchesCategory = currentCategoryFilter === 'All' || lead.category === currentCategoryFilter;
        const matchesSearch = (lead.title?.toLowerCase().includes(searchTerm) || lead.description?.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    const summary = document.getElementById('lead-results-summary');
    if (summary) summary.innerText = `Showing ${filteredLeads.length} leads`;

    if (filteredLeads.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">No leads found.</div>';
        return;
    }

    grid.innerHTML = filteredLeads.map(data => `
        <div class="lead-card-new" style="background:white; padding:30px; border-radius:8px; display:flex; gap:20px; border:1px solid #f0f4f9; margin-bottom:15px;">
            <div style="flex:1;">
                <div style="display:flex; justify-content:between; align-items:center; margin-bottom:10px;">
                    <h4 style="font-size:18px; margin:0; color:var(--primary);">${data.title}</h4>
                    <span class="badge" style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:12px; font-size:12px;">${data.category}</span>
                </div>
                <p style="font-size:14px; color:var(--text-muted);">${data.description}</p>
                <button onclick="window.navigate('contact-view')" style="background:none; border:none; color:var(--accent-dark); font-weight:700; cursor:pointer; padding:0;">Apply Now →</button>
            </div>
        </div>
    `).join("");
};

// ==========================================
// 04. SECURE ADMIN PORTAL AUTHENTICATION
// ==========================================
window.checkLogin = function (e) {
    e.preventDefault();
    const email = document.getElementById("admin-email")?.value;
    const pass = document.getElementById("admin-password")?.value;

    if (email === "admin@gmail.com" && pass === "1234") {
        sessionStorage.setItem('adminAuth', 'true');
        window.navigate('admin-dashboard-view');
    } else {
        alert("Invalid Access Credentials Configuration");
    }
};

window.logout = function () {
    sessionStorage.removeItem('adminAuth');
    window.navigate('admin-login-view');
};

// ==========================================
// 05. PRIVATE SYSTEM CRM CONTROL PANEL ENGINE
// ==========================================
window.switchAdminTab = function (tabName) {
    document.querySelectorAll('.crm-sidebar a').forEach(a => a.classList.remove('active'));
    const targetedNavLink = document.getElementById(`nav-${tabName}`);
    if (targetedNavLink) targetedNavLink.classList.add('active');

    const tabs = ['dash', 'leads', 'users', 'contactforms', 'reports'];
    tabs.forEach(t => {
        const tabEl = document.getElementById(`tab-${t}`);
        if (tabEl) tabEl.classList.add('hidden');
    });
    
    const targetedTabWindow = document.getElementById(`tab-${tabName}`);
    if (targetedTabWindow) targetedTabWindow.classList.remove('hidden');

    if (tabName === 'dash') window.loadAdminDash();
    if (tabName === 'leads') window.loadAdminLeads();
    if (tabName === 'contactforms' || tabName === 'users') window.loadContactFormsAndKanban();
    if (tabName === 'reports') window.loadAdminReports();
};

window.openAddLeadModal = function() {
    window.currentEditingLeadId = null; 
    if (document.getElementById('modal-title')) document.getElementById('modal-title').value = "";
    if (document.getElementById('modal-cat')) document.getElementById('modal-cat').value = "";
    if (document.getElementById('modal-desc')) document.getElementById('modal-desc').value = "";

    const modal = document.getElementById('add-lead-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const submitBtn = modal.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerText = "Publish Lead";
    }
};

window.openEditLeadModal = function (id, title, category, description) {
    window.currentEditingLeadId = id; 

    if (document.getElementById('modal-title')) document.getElementById('modal-title').value = title;
    if (document.getElementById('modal-cat')) document.getElementById('modal-cat').value = category;
    if (document.getElementById('modal-desc')) document.getElementById('modal-desc').value = description;

    const modal = document.getElementById('add-lead-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const submitBtn = modal.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerText = "Update Lead";
    }
};

window.loadAdminDash = async function() {
    if (!db) return;
    try {
        const snap = await getDocs(collection(db, "published_leads"));
        if (document.getElementById('dash-total')) document.getElementById('dash-total').innerText = snap.size;
        if (document.getElementById('dash-active')) document.getElementById('dash-active').innerText = snap.size;
    } catch (e) { console.error(e); }
};

window.submitNewLead = async function (e) {
    e.preventDefault();
    const title = document.getElementById('modal-title')?.value;
    const cat = document.getElementById('modal-cat')?.value;
    const desc = document.getElementById('modal-desc')?.value;

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.innerText = "Saving...";

    try {
        if (window.currentEditingLeadId) {
            await updateDoc(doc(db, "published_leads", window.currentEditingLeadId), {
                title: title, category: cat, description: desc
            });
            window.currentEditingLeadId = null;
            alert("Lead updated successfully!");
        } else {
            await addDoc(collection(db, "published_leads"), {
                title: title, category: cat, description: desc, status: "Active", timestamp: serverTimestamp()
            });
            alert("Lead published successfully!");
        }

        const modal = document.getElementById('add-lead-modal');
        if (modal) modal.classList.add('hidden');
        
        e.target.reset();
        window.loadAdminLeads();
        window.loadAdminDash();
    } catch (err) { console.error(err); } finally {
        if (btn) btn.innerText = "Publish Lead";
    }
};

window.deletePublishedLead = async function (id) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
        await deleteDoc(doc(db, "published_leads", id));
        window.loadAdminLeads();
        window.loadAdminDash();
    } catch (err) { console.error(err); }
};

window.loadAdminLeads = async function() {
    if (!db) return;
    const tbody = document.getElementById('admin-published-leads-table');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Loading...</td></tr>';

    try {
        const snap = await getDocs(collection(db, "published_leads"));
        let html = '';
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;

            const safeTitle = (data.title || "").replace(/'/g, "\\'").replace(/"/g, '\\"');
            const safeCat = (data.category || "").replace(/'/g, "\\'").replace(/"/g, '\\"');
            const safeDesc = (data.description || "").replace(/'/g, "\\'").replace(/"/g, '\\"');

            html += `
            <tr style="border-bottom:1px solid #edf2f7;">
                <td style="padding:16px; font-weight:600;">${data.title}</td>
                <td style="padding:16px;"><span class="badge" style="background:#e0f2fe; padding:4px 10px; border-radius:12px; font-size:12px;">${data.category}</span></td>
                <td style="padding:16px;"><span class="badge" style="background:#e6f4ea; color:#137333; padding:4px 10px; border-radius:12px; font-size:12px;">Active</span></td>
                <td style="padding:16px;">
                    <div style="display:flex; gap:8px;">
                        <button class="btn-sm" onclick="window.openEditLeadModal('${id}', '${safeTitle}', '${safeCat}', '${safeDesc}')" style="background:#f59e0b; color:white; border:none; padding:6px 14px; border-radius:4px; font-weight:600; font-size:12px; cursor:pointer;"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button class="btn-sm" onclick="window.deletePublishedLead('${id}')" style="background:#dc2626; color:white; border:none; padding:6px 14px; border-radius:4px; font-weight:600; font-size:12px; cursor:pointer;">Delete</button>
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="4" style="text-align:center; padding:20px;">No leads found.</td></tr>';
    } catch (e) { console.error(e); }
};

// ==========================================
// 06. CONTACT FORM ENQUIRIES STATUS SYNC ENGINE (Screenshot Fixed)
// ==========================================
window.updateContactStatus = async function (id, newStatus) {
    try {
        // Firebase मध्ये अचूक स्टेटस बदल सेव्ह करणे
        await updateDoc(doc(db, "contact_submissions", id), { status: newStatus });
        // टेबल आणि कानबान व्ह्यू रीलोड करणे
        window.loadContactFormsAndKanban();
    } catch (err) { 
        console.error("Status update error: ", err); 
    }
};

window.loadContactFormsAndKanban = async function() {
    if (!db) return;
    const tbody = document.getElementById('admin-contact-forms-table');
    if (!tbody) return;

    try {
        const snap = await getDocs(collection(db, "contact_submissions"));
        let tableHtml = '';
        const kb = { NEW: '', CONTACTED: '', IN_PROGRESS: '', CONVERTED: '', LOST: '' };

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const s = data.status || "NEW";

            // स्क्रीनशॉट प्रमाणे बॅजचे कलर्स मॅनेज करणे
            let sBadgeStyle = 'background:#e0f2fe; color:#0369a1;'; // Default NEW (Blue)
            if (s === 'CONTACTED') sBadgeStyle = 'background:#fef3c7; color:#d97706;'; // Yellow/Orange
            if (s === 'IN_PROGRESS') sBadgeStyle = 'background:#f3e8ff; color:#6b21a8;'; // Purple
            if (s === 'CONVERTED') sBadgeStyle = 'background:#e6f4ea; color:#137333;'; // Green
            if (s === 'LOST') sBadgeStyle = 'background:#fee2e2; color:#991b1b;'; // Red

            // स्क्रीनशॉट प्रमाणे अचूक टेबल रो (Row) तयार करणे
            tableHtml += `
            <tr style="border-bottom:1px solid #edf2f7;">
                <td style="padding:16px; font-weight:600;">${data.name}</td>
                <td style="padding:16px;">${data.email}</td>
                <td style="padding:16px;">${data.phone}</td>
                <td style="padding:16px;">${data.message}</td>
                <td style="padding:16px;">
                    <span class="badge" style="${sBadgeStyle} padding:6px 14px; border-radius:12px; font-size:12px; font-weight:600; text-transform:uppercase;">${s}</span>
                </td>
                <td style="padding:16px;">
                    <div style="display:flex; gap:6px;">
                        <button onclick="window.updateContactStatus('${id}','CONTACTED')" style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer;">Contact</button>
                        <button onclick="window.updateContactStatus('${id}','IN_PROGRESS')" style="background:#7c3aed; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer;">Progress</button>
                        <button onclick="window.updateContactStatus('${id}','CONVERTED')" style="background:#16a34a; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer;">Convert</button>
                        <button onclick="window.updateContactStatus('${id}','LOST')" style="background:#dc2626; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer;">Lost</button>
                    </div>
                </td>
            </tr>`;

            const cardMarkup = `<div class="kanban-card" style="background:white; padding:14px; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.1); margin-bottom:10px; border-left:4px solid #2563eb; font-weight:600; font-size:13px;">${data.name}</div>`;
            if (kb[s] !== undefined) kb[s] += cardMarkup;
        });

        tbody.innerHTML = tableHtml || '<tr><td colspan="6" style="text-align:center; padding:20px;">No records found.</td></tr>';

        // Kanban बोर्ड देखील सिंक ठेवणे
        const tabs = ['new', 'contacted', 'inprogress', 'converted', 'lost'];
        tabs.forEach(t => {
            const el = document.getElementById(`kb-${t}`);
            if (el) el.innerHTML = kb[t.toUpperCase().replace('INPROGRESS', 'IN_PROGRESS')] || '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:10px;">No Leads</div>';
        });

    } catch (e) { console.error(e); }
};

window.loadAdminReports = async function() {
    if (!db) return;
    try {
        const snap = await getDocs(collection(db, "contact_submissions"));
        if (document.getElementById('rep-total')) document.getElementById('rep-total').innerText = snap.size;
    } catch (e) { console.error(e); }
};

// System Initializer
document.addEventListener("DOMContentLoaded", () => {
    window.loadPublicLeads();
});
