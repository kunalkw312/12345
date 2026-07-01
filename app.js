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
// 02. HELPER: DYNAMIC CATEGORY ICONS
// ==========================================
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
// 03. PUBLIC VIEW CLIENT ACTIONS & LEAD PROCESSING
// ==========================================
window.submitContactForm = async function (e) {
    e.preventDefault();
    if (!db) return alert("Database connection error. Please try again later.");

    const form = e.target;
    
    // Dynamically grab values regardless of which specific form was submitted
    const name = form.name?.value || form.querySelector('input[placeholder*="Name"]')?.value || '';
    const email = form.email?.value || form.querySelector('input[placeholder*="Email"]')?.value || '';
    const phone = form.phone?.value || form.querySelector('input[placeholder*="Phone"]')?.value || '';
    
    // Safely capture the message, accounting for the new Quick Inquiry textarea
    const message = form.message?.value || form.querySelector('textarea')?.value || 'Quick Inquiry (No Message Provided)';

    const btn = form.querySelector('button');
    const originalText = btn ? btn.innerText : 'Send Message';
    
    if (btn) btn.innerText = "Sending...";

    try {
        await addDoc(collection(db, "contact_submissions"), {
            name, 
            email, 
            phone, 
            message,
            status: "NEW",
            timestamp: serverTimestamp()
        });
        
        alert("Your inquiry has been submitted successfully! A data specialist will contact you shortly.");
        form.reset();
    } catch (error) {
        console.error("Submission Error:", error);
        alert("Failed to submit request. Please check your connection.");
    } finally {
        if (btn) btn.innerText = originalText;
    }
};

window.loadPublicLeads = async function () {
    const grid = document.getElementById('public-leads-grid');
    if (!grid) return;
    if (!db) return;

    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-weight:500;">Connecting to live database...</div>';

    try {
        const snap = await getDocs(collection(db, "published_leads"));
        allPublishedLeads = [];
        snap.forEach(doc => {
            allPublishedLeads.push(doc.data());
        });
        window.filterPublicLeads(); 
    } catch (e) {
        console.error("Database Load Error:", e);
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#dc2626; font-weight:500;">Error loading leads database.</div>';
    }
};

window.setLeadFilter = function (category) {
    currentCategoryFilter = category;
    
    // Sync the active state of the filter pills visually
    document.querySelectorAll('.pill').forEach(btn => {
        if (btn.innerText.trim() === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    window.filterPublicLeads();
};

window.filterPublicLeads = function () {
    const grid = document.getElementById('public-leads-grid');
    if (!grid) return;

    const searchInput = document.getElementById('lead-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    // Filter by both exact Category match and fuzzy Search term
    let filteredLeads = allPublishedLeads.filter(lead => {
        const matchesCategory = currentCategoryFilter === 'All' || lead.category === currentCategoryFilter;
        const matchesSearch = (lead.title?.toLowerCase().includes(searchTerm) || lead.description?.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    if (filteredLeads.length === 0) {
        grid.className = ""; // Remove the 2-column grid class to center the empty state text
        grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted); width: 100%; font-weight:500;">No leads found matching your criteria. Try clearing your search.</div>';
        return;
    }

    grid.className = "leads-grid-2"; // Restore the 2-column grid layout
    
    // Map the filtered data strictly into the new HTML design structure
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
    
    // Clear the modal form values
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

    // Populate the modal form with existing data
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
    } catch (e) { 
        console.error("Dashboard Sync Error:", e); 
    }
};

window.submitNewLead = async function (e) {
    e.preventDefault();
    const title = document.getElementById('modal-title')?.value;
    const cat = document.getElementById('modal-cat')?.value;
    const desc = document.getElementById('modal-desc')?.value;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerText : 'Publish';
    if (btn) btn.innerText = "Saving Data...";

    try {
        if (window.currentEditingLeadId) {
            // Update existing lead
            await updateDoc(doc(db, "published_leads", window.currentEditingLeadId), {
                title: title, 
                category: cat, 
                description: desc
            });
            window.currentEditingLeadId = null;
            alert("Lead listing updated successfully!");
        } else {
            // Create new lead
            await addDoc(collection(db, "published_leads"), {
                title: title, 
                category: cat, 
                description: desc, 
                status: "Active", 
                timestamp: serverTimestamp()
            });
            alert("New lead listing published successfully!");
        }

        const modal = document.getElementById('add-lead-modal');
        if (modal) modal.classList.add('hidden');
        
        e.target.reset();
        
        // Refresh tables and counts
        window.loadAdminLeads();
        window.loadAdminDash();
    } catch (err) { 
        console.error("Submission Error:", err); 
        alert("Failed to save lead data.");
    } finally {
        if (btn) btn.innerText = originalText;
    }
};

window.deletePublishedLead = async function (id) {
    if (!confirm("Are you certain you want to delete this lead from the public database?")) return;
    try {
        await deleteDoc(doc(db, "published_leads", id));
        window.loadAdminLeads();
        window.loadAdminDash();
    } catch (err) { 
        console.error("Deletion Error:", err); 
    }
};

window.loadAdminLeads = async function() {
    if (!db) return;
    const tbody = document.getElementById('admin-published-leads-table');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">Fetching Database...</td></tr>';

    try {
        const snap = await getDocs(collection(db, "published_leads"));
        let html = '';
        
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;

            // Sanitize string outputs to prevent breaking inline HTML function calls
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
                        <button onclick="window.deletePublishedLead('${id}')" style="background:#dc2626; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:600; font-size:12px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Delete</button>
                    </div>
                </td>
            </tr>`;
        });
        
        tbody.innerHTML = html || '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No live leads found.</td></tr>';
    } catch (e) { 
        console.error("Admin Load Error:", e); 
    }
};

// ==========================================
// 06. CONTACT FORM ENQUIRIES & KANBAN SYNC ENGINE
// ==========================================
window.updateContactStatus = async function (id, newStatus) {
    try {
        await updateDoc(doc(db, "contact_submissions", id), { status: newStatus });
        window.loadContactFormsAndKanban();
    } catch (err) { 
        console.error("CRM Pipeline Sync error: ", err); 
    }
};

window.loadContactFormsAndKanban = async function() {
    if (!db) return;
    const tbody = document.getElementById('admin-contact-forms-table');
    if (!tbody) return;

    try {
        const snap = await getDocs(collection(db, "contact_submissions"));
        let tableHtml = '';
        
        // Initialize Kanban board HTML containers
        const kb = { NEW: '', CONTACTED: '', IN_PROGRESS: '', CONVERTED: '', LOST: '' };

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const s = data.status || "NEW";

            // Define Badge styling matrix based on status state
            let sBadgeStyle = 'background:#f1f5f9; color:#475569;'; // NEW
            if (s === 'CONTACTED') sBadgeStyle = 'background:#fef3c7; color:#d97706;'; 
            if (s === 'IN_PROGRESS') sBadgeStyle = 'background:#f3e8ff; color:#9333ea;'; 
            if (s === 'CONVERTED') sBadgeStyle = 'background:#dcfce7; color:#16a34a;'; 
            if (s === 'LOST') sBadgeStyle = 'background:#fee2e2; color:#dc2626;'; 

            tableHtml += `
            <tr style="border-bottom:1px solid #edf2f7;">
                <td style="padding:16px; font-weight:600; color:var(--secondary);">${data.name}</td>
                <td style="padding:16px;">${data.email}</td>
                <td style="padding:16px;">${data.phone}</td>
                <td style="padding:16px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${data.message}">${data.message}</td>
                <td style="padding:16px;">
                    <span style="${sBadgeStyle} padding:6px 12px; border-radius:12px; font-size:11px; font-weight:700; letter-spacing:0.5px;">${s}</span>
                </td>
                <td style="padding:16px;">
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button onclick="window.updateContactStatus('${id}','CONTACTED')" style="background:#f59e0b; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;" title="Mark as Contacted">Call</button>
                        <button onclick="window.updateContactStatus('${id}','IN_PROGRESS')" style="background:#9333ea; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;" title="Mark as In Progress">WIP</button>
                        <button onclick="window.updateContactStatus('${id}','CONVERTED')" style="background:#16a34a; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;" title="Mark as Won">Won</button>
                        <button onclick="window.updateContactStatus('${id}','LOST')" style="background:#dc2626; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;" title="Mark as Lost">Lost</button>
                    </div>
                </td>
            </tr>`;

            // Kanban Card Generation
            const cardMarkup = `
            <div style="background:white; padding:12px; border-radius:6px; border:1px solid #e2e8f0; margin-bottom:10px; font-weight:600; font-size:13px; color:var(--secondary); box-shadow:var(--shadow-sm);">
                <div style="margin-bottom:4px;">${data.name}</div>
                <div style="font-size:11px; color:var(--text-muted); font-weight:400;">${data.phone}</div>
            </div>`;
            
            if (kb[s] !== undefined) kb[s] += cardMarkup;
        });

        tbody.innerHTML = tableHtml || '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No records found in the pipeline.</td></tr>';

        // Synchronize Kanban board targets with generated cards
        const tabs = ['new', 'contacted', 'inprogress', 'converted', 'lost'];
        tabs.forEach(t => {
            const el = document.getElementById(`kb-${t}`);
            if (el) {
                el.innerHTML = kb[t.toUpperCase().replace('INPROGRESS', 'IN_PROGRESS')] || '<div style="color:var(--text-muted); font-size:12px; text-align:center; padding:10px; font-weight:500;">Empty</div>';
            }
        });

    } catch (e) { 
        console.error("CRM Data Fetch Error:", e); 
    }
};

// ==========================================
// 07. SYSTEM INITIALIZER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Only load public leads into the UI if we aren't starting on a secure admin route
    const currentHash = window.location.hash;
    if (currentHash !== '#admin') {
        window.loadPublicLeads();
    }
});
