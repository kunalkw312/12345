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

// Helper to get category icons matching the new UI
function getCategoryIcon(category) {
    const icons = {
        'Finance': 'fa-money-bill-wave',
        'Legal': 'fa-scale-balanced',
        'Insurance': 'fa-shield-halved',
        'Data': 'fa-database',
        'B2B': 'fa-building',
        'Marketing': 'fa-bullhorn',
        'Healthcare': 'fa-heart-pulse',
        'Lifestyle': 'fa-plane',
        'IT': 'fa-laptop-code',
        'Renewable Energy': 'fa-solar-panel'
    };
    return icons[category] || 'fa-list';
}

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
    const message = form.message?.value || form.querySelector('textarea')?.value || 'Quick Inquiry (No Message Provided)';

    const btn = form.querySelector('button');
    const originalText = btn ? btn.innerText : 'Send Message';
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
        if (btn) btn.innerText = originalText;
    }
};

window.loadPublicLeads = async function () {
    const grid = document.getElementById('public-leads-grid');
    if (!grid) return;
    if (!db) return;

    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">Loading live database...</div>';

    try {
        const snap = await getDocs(collection(db, "published_leads"));
        allPublishedLeads = [];
        snap.forEach(doc => {
            allPublishedLeads.push(doc.data());
        });
        window.filterPublicLeads(); 
    } catch (e) {
        console.error(e);
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Error loading leads.</div>';
    }
};

window.setLeadFilter = function (category) {
    currentCategoryFilter = category;
    
    // Update pill active states based on the new UI class (.pill)
    document.querySelectorAll('.pill').forEach(btn => {
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

    if (filteredLeads.length === 0) {
        grid.className = ""; // Remove grid class for empty state
        grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted); width: 100%;">No leads found matching your criteria.</div>';
        return;
    }

    grid.className = "leads-grid-2"; // Apply the 2-column grid from the new CSS
    
    // Output UI matching the new `lead-card-new` design
    grid.innerHTML = filteredLeads.map(data => {
        const iconClass = getCategoryIcon(data.category);
        return `
        <div class="lead-card-new">
            <div class="lcn-header">
                <h4><i class="fa-solid ${iconClass}"></i> ${data.title}</h4>
                <span class="lcn-badge">${data.category}</span>
            </div>
            <p>${data.description}</p>
            <button onclick="window.navigate('contact-view')">View Details &rarr;</button>
        </div>
        `;
    }).join("");
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

    const tabs = ['dash', 'leads', 'users', 'contactforms'];
    tabs.forEach(t => {
        const tabEl = document.getElementById(`tab-${t}`);
        if (tabEl) tabEl.classList.add('hidden');
    });
    
    const targetedTabWindow = document.getElementById(`tab-${tabName}`);
    if (targetedTabWindow) targetedTabWindow.classList.remove('hidden');

    if (tabName === 'dash') window.loadAdminDash();
    if (tabName === 'leads') window.loadAdminLeads();
    if (tabName === 'contactforms' || tabName === 'users') window.loadContactFormsAndKanban();
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
                <td style="padding:16px; font-weight:600; color:var(--secondary);">${data.title}</td>
                <td style="padding:16px;"><span style="background:#e0f2fe; color:var(--primary); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600;">${data.category}</span></td>
                <td style="padding:16px;"><span style="background:#dcfce7; color:#16a34a; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600;">Active</span></td>
                <td style="padding:16px;">
                    <div style="display:flex; gap:8px;">
                        <button onclick="window.openEditLeadModal('${id}', '${safeTitle}', '${safeCat}', '${safeDesc}')" style="background:#f59e0b; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:600; font-size:12px; cursor:pointer;"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button onclick="window.deletePublishedLead('${id}')" style="background:#dc2626; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:600; font-size:12px; cursor:pointer;">Delete</button>
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="4" style="text-align:center; padding:20px;">No leads found.</td></tr>';
    } catch (e) { console.error(e); }
};

// ==========================================
// 06. CONTACT FORM ENQUIRIES STATUS SYNC ENGINE
// ==========================================
window.updateContactStatus = async function (id, newStatus) {
    try {
        await updateDoc(doc(db, "contact_submissions", id), { status: newStatus });
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

            let sBadgeStyle = 'background:#f1f5f9; color:#475569;'; // Default NEW
            if (s === 'CONTACTED') sBadgeStyle = 'background:#fef3c7; color:#d97706;'; 
            if (s === 'IN_PROGRESS') sBadgeStyle = 'background:#f3e8ff; color:#9333ea;'; 
            if (s === 'CONVERTED') sBadgeStyle = 'background:#dcfce7; color:#16a34a;'; 
            if (s === 'LOST') sBadgeStyle = 'background:#fee2e2; color:#dc2626;'; 

            tableHtml += `
            <tr style="border-bottom:1px solid #edf2f7;">
                <td style="padding:16px; font-weight:600; color:var(--secondary);">${data.name}</td>
                <td style="padding:16px;">${data.email}</td>
                <td style="padding:16px;">${data.phone}</td>
                <td style="padding:16px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${data.message}</td>
                <td style="padding:16px;">
                    <span style="${sBadgeStyle} padding:6px 12px; border-radius:12px; font-size:11px; font-weight:700; letter-spacing:0.5px;">${s}</span>
                </td>
                <td style="padding:16px;">
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button onclick="window.updateContactStatus('${id}','CONTACTED')" style="background:#f59e0b; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">Contact</button>
                        <button onclick="window.updateContactStatus('${id}','IN_PROGRESS')" style="background:#9333ea; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">Progress</button>
                        <button onclick="window.updateContactStatus('${id}','CONVERTED')" style="background:#16a34a; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">Convert</button>
                        <button onclick="window.updateContactStatus('${id}','LOST')" style="background:#dc2626; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">Lost</button>
                    </div>
                </td>
            </tr>`;

            const cardMarkup = `<div style="background:white; padding:12px; border-radius:6px; border:1px solid #e2e8f0; margin-bottom:10px; font-weight:600; font-size:13px; color:var(--secondary); box-shadow:var(--shadow-sm);">${data.name}</div>`;
            if (kb[s] !== undefined) kb[s] += cardMarkup;
        });

        tbody.innerHTML = tableHtml || '<tr><td colspan="6" style="text-align:center; padding:20px;">No records found.</td></tr>';

        const tabs = ['new', 'contacted', 'inprogress', 'converted', 'lost'];
        tabs.forEach(t => {
            const el = document.getElementById(`kb-${t}`);
            if (el) el.innerHTML = kb[t.toUpperCase().replace('INPROGRESS', 'IN_PROGRESS')] || '<div style="color:var(--text-muted); font-size:12px; text-align:center; padding:10px;">Empty</div>';
        });

    } catch (e) { console.error(e); }
};

// System Initializer
document.addEventListener("DOMContentLoaded", () => {
    // Only load public leads if we aren't starting on an admin route
    const hash = window.location.hash;
    if (hash !== '#admin') {
        window.loadPublicLeads();
    }
});
