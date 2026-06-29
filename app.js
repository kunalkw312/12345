// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 1. FIREBASE SETUP
// ==========================================
let db = null;

try {
    // INSERT YOUR ACTUAL FIREBASE CONFIG HERE
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
    console.error("Firebase Init Error: ", error);
}

// Global state for public leads filtering
let allPublishedLeads = [];
let currentCategoryFilter = 'All';

// ==========================================
// 2. MAIN APP ROUTING (Public vs Admin)
// ==========================================
window.navigate = function(viewId) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if(target) target.classList.add('active');

    const isAdminView = (viewId === 'admin-login-view' || viewId === 'admin-dashboard-view');
    document.getElementById('main-header').style.display = isAdminView ? 'none' : 'flex';
    document.getElementById('main-footer').style.display = isAdminView ? 'none' : 'block';
    
    if (viewId === 'admin-dashboard-view') {
        if (sessionStorage.getItem('adminAuth') !== 'true') {
            window.navigate('admin-login-view');
        } else {
            window.switchAdminTab('dash'); 
        }
    }
    
    if (viewId === 'public-leads-view') {
        window.loadPublicLeads();
    }
    window.scrollTo(0, 0);
};

// ==========================================
// 3. PUBLIC ACTIONS (Contact Forms & Leads)
// ==========================================
window.submitContactForm = async function(e) {
    e.preventDefault();
    if (!db) return alert("Database not connected. Check Firebase Config.");

    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const phone = form.phone.value;
    const message = form.message.value;

    const btn = form.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Sending...";

    try {
        await addDoc(collection(db, "contact_submissions"), {
            name, email, phone, message,
            status: "NEW",
            timestamp: serverTimestamp()
        });
        alert("Your request has been submitted successfully!");
        form.reset();
    } catch (error) {
        console.error("Firebase Write Error:", error);
        alert("Error submitting. Please check your Firestore Database Rules.");
    } finally {
        btn.innerText = originalText;
    }
};

window.loadPublicLeads = async function() {
    const grid = document.getElementById('public-leads-grid');
    if (!db) { grid.innerHTML = '<div style="grid-column:1/-1;">Database error. Check Firebase Config.</div>'; return; }

    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center;">Loading active leads...</div>';

    try {
        const snap = await getDocs(collection(db, "published_leads"));
        allPublishedLeads = [];
        
        snap.forEach(doc => {
            allPublishedLeads.push(doc.data());
        });
        
        window.filterPublicLeads(); // Render leads immediately using default filters
        
    } catch (e) {
        console.error("Firestore Read Error:", e);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:red;">Error loading leads. Check Firestore Rules.</div>';
    }
};

// Handle Category Pill Clicks
window.setLeadFilter = function(category) {
    currentCategoryFilter = category;
    
    // Update active pill UI
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if(btn.innerText === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    window.filterPublicLeads();
}

// Filter and Render Leads
window.filterPublicLeads = function() {
    const grid = document.getElementById('public-leads-grid');
    const searchTerm = document.getElementById('lead-search-input').value.toLowerCase();
    
    let filteredLeads = allPublishedLeads.filter(lead => {
        // Match Category
        const matchesCategory = currentCategoryFilter === 'All' || lead.category === currentCategoryFilter;
        // Match Search term
        const matchesSearch = lead.title.toLowerCase().includes(searchTerm) || lead.description.toLowerCase().includes(searchTerm) || lead.category.toLowerCase().includes(searchTerm);
        
        return matchesCategory && matchesSearch;
    });
    
    // Update the Summary Text
    const summary = document.getElementById('lead-results-summary');
    if(summary) {
        summary.innerText = currentCategoryFilter === 'All' 
            ? `Showing ${filteredLeads.length} total leads` 
            : `Showing ${filteredLeads.length} leads in ${currentCategoryFilter}`;
    }

    if (filteredLeads.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">No leads match your criteria.</div>';
        return;
    }

    let html = '';
    filteredLeads.forEach(data => {
        // Assign icon based on category
        let iconClass = "fa-briefcase";
        if (data.category === "Insurance") iconClass = "fa-shield-halved";
        if (data.category === "Finance") iconClass = "fa-dollar-sign";
        if (data.category === "Legal") iconClass = "fa-scale-balanced";
        if (data.category === "Healthcare") iconClass = "fa-heart-pulse";
        if (data.category === "RenewableEnergy") iconClass = "fa-leaf";
        if (data.category === "IT") iconClass = "fa-laptop-code";
        
        html += `
            <div class="lead-card-new">
                <div class="lead-icon"><i class="fa-solid ${iconClass}"></i></div>
                <div class="lead-details" style="flex: 1;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 5px;">
                        <h4>${data.title}</h4>
                        <span class="badge badge-light-blue" style="background:#e0f2fe; color:#0f2f63;">${data.category}</span>
                    </div>
                    <p>${data.description}</p>
                    <button class="btn-view" onclick="window.navigate('contact-view')">View Details →</button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

// ==========================================
// 4. ADMIN AUTHENTICATION
// ==========================================
window.checkLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById("admin-email").value;
    const pass = document.getElementById("admin-password").value;

    if (email === "admin@gmail.com" && pass === "1234") {
        sessionStorage.setItem('adminAuth', 'true');
        document.getElementById("admin-password").value = '';
        window.navigate('admin-dashboard-view');
    } else {
        alert("Invalid Credentials");
    }
};

window.logout = function() {
    sessionStorage.removeItem('adminAuth');
    window.navigate('admin-login-view');
};

// ==========================================
// 5. CRM PANEL ROUTING & LOGIC
// ==========================================
window.switchAdminTab = function(tabName) {
    document.querySelectorAll('.crm-sidebar a').forEach(a => a.classList.remove('active'));
    document.getElementById(`nav-${tabName}`).classList.add('active');

    const tabs = ['dash', 'leads', 'users', 'contactforms', 'reports'];
    tabs.forEach(t => document.getElementById(`tab-${t}`).classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    if(tabName === 'dash') loadAdminDash();
    if(tabName === 'leads') loadAdminLeads();
    if(tabName === 'contactforms' || tabName === 'users') loadContactFormsAndKanban();
    if(tabName === 'reports') loadAdminReports();
};

window.openAddLeadModal = () => document.getElementById('add-lead-modal').classList.remove('hidden');

// --- Tab 1: Dashboard Data ---
async function loadAdminDash() {
    if(!db) return;
    try {
        const snap = await getDocs(collection(db, "published_leads"));
        document.getElementById('dash-total').innerText = snap.size;
        document.getElementById('dash-active').innerText = snap.size; 
        document.getElementById('dash-new').innerText = 0; 
    } catch(e) { console.error(e); }
}

// --- Tab 2: Leads (Published) ---
window.submitNewLead = async function(e) {
    e.preventDefault();
    const title = document.getElementById('modal-title').value;
    const cat = document.getElementById('modal-cat').value;
    const desc = document.getElementById('modal-desc').value;

    try {
        await addDoc(collection(db, "published_leads"), {
            title, category: cat, description: desc, status: "Active", timestamp: serverTimestamp()
        });
        document.getElementById('add-lead-modal').classList.add('hidden');
        e.target.reset();
        loadAdminLeads();
        loadAdminDash();
    } catch (err) { console.error(err); alert("Error adding lead."); }
};

window.deletePublishedLead = async function(id) {
    if(!confirm("Delete this lead?")) return;
    await deleteDoc(doc(db, "published_leads", id));
    loadAdminLeads();
};

async function loadAdminLeads() {
    if(!db) return;
    const tbody = document.getElementById('admin-published-leads-table');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    
    try {
        const snap = await getDocs(collection(db, "published_leads"));
        document.getElementById('leads-tab-total-btn').innerText = `Total Leads: ${snap.size}`;
        let html = '';
        snap.forEach(d => {
            const data = d.data();
            const badgeColor = data.category === 'Finance' ? 'badge-light-blue' : (data.category==='B2B'?'badge-light-purple':'badge-light-green');
            
            html += `
            <tr>
                <td style="font-weight:600;">${data.title}</td>
                <td><span class="badge ${badgeColor}">${data.category}</span></td>
                <td><span class="badge badge-light-green">Active</span></td>
                <td>
                    <button class="btn-sm bg-red" onclick="window.deletePublishedLead('${d.id}')">Delete</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="4">No leads published.</td></tr>';
    } catch(e) { console.error(e); tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Error loading leads. Check Firestore Rules.</td></tr>'; }
}

// --- Tab 3 & 4: Users (Kanban) & Contact Forms ---
window.updateContactStatus = async function(id, newStatus) {
    await updateDoc(doc(db, "contact_submissions", id), { status: newStatus });
    loadContactFormsAndKanban();
};

window.deleteContactForm = async function(id) {
    if(!confirm("Delete submission?")) return;
    await deleteDoc(doc(db, "contact_submissions", id));
    loadContactFormsAndKanban();
};

async function loadContactFormsAndKanban() {
    if(!db) return;
    const tbody = document.getElementById('admin-contact-forms-table');
    const kb = { NEW: '', CONTACTED: '', IN_PROGRESS: '', CONVERTED: '', LOST: '' };

    try {
        const snap = await getDocs(collection(db, "contact_submissions"));
        let tableHtml = '';

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const s = data.status || "NEW";
            
            let sBadge = s === 'NEW' ? 'badge-light-blue' : s === 'CONTACTED' ? 'badge-light-yellow' : s === 'IN_PROGRESS' ? 'badge-light-purple' : 'badge-light-green';
            if(s==='LOST') sBadge = 'badge-light-red';

            tableHtml += `
            <tr>
                <td style="font-weight:500;">${data.name}</td>
                <td>${data.email}</td>
                <td>${data.phone}</td>
                <td><div style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${data.message}</div></td>
                <td><span class="badge ${sBadge}">${s}</span></td>
                <td style="min-width: 250px;">
                    <button class="btn-sm bg-blue" onclick="window.updateContactStatus('${id}','CONTACTED')">Contact</button>
                    <button class="btn-sm bg-purple" onclick="window.updateContactStatus('${id}','IN_PROGRESS')">Progress</button>
                    <button class="btn-sm bg-green" onclick="window.updateContactStatus('${id}','CONVERTED')">Convert</button>
                    <button class="btn-sm bg-red" onclick="window.updateContactStatus('${id}','LOST')">Lost</button>
                </td>
            </tr>`;

            if(kb[s] !== undefined) {
                kb[s] += `<div class="kanban-card">${data.name}</div>`;
            } else {
                kb['NEW'] += `<div class="kanban-card">${data.name}</div>`; 
            }
        });

        tbody.innerHTML = tableHtml || '<tr><td colspan="6">No form submissions yet.</td></tr>';
        
        document.getElementById('kb-new').innerHTML = kb.NEW || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';
        document.getElementById('kb-contacted').innerHTML = kb.CONTACTED || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';
        document.getElementById('kb-inprogress').innerHTML = kb.IN_PROGRESS || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';
        document.getElementById('kb-converted').innerHTML = kb.CONVERTED || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';
        document.getElementById('kb-lost').innerHTML = kb.LOST || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="color:red;">Error loading data. Check Firestore Rules.</td></tr>';
    }
}

// --- Tab 5: Reports ---
async function loadAdminReports() {
    if(!db) return;
    try {
        const snap = await getDocs(collection(db, "contact_submissions"));
        let active = 0, lost = 0, total = snap.size;
        
        snap.forEach(d => {
            const s = d.data().status;
            if(s === 'LOST') lost++;
            else active++; 
        });

        document.getElementById('rep-total').innerText = total;
        document.getElementById('rep-active').innerText = active;
        document.getElementById('rep-inactive').innerText = lost;

        setTimeout(() => {
            document.getElementById('chart-total').style.height = total > 0 ? '100%' : '10%';
            document.getElementById('chart-active').style.height = total > 0 ? `${(active/total)*100}%` : '10%';
            document.getElementById('chart-inactive').style.height = total > 0 ? `${(lost/total)*100}%` : '10%';
        }, 100);

    } catch (e) { console.error(e); }
}
