// =========================================================================
// ARCHITECTURE LOGIC STACK CORE MATRIX INFRASTRUCTURE INTERFACE
// =========================================================================
import { db, auth } from './config.js';
import { 
    collection, addDoc, getDocs, onSnapshot, query, where, doc, deleteDoc, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { 
    signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// STATE REGISTRATION & CONFIGURATION PROPERTIES VARIABLES TRACK
let currentFilterCategory = 'all';
let publicLeadsTrackingArray = [];

// =========================================================================
// APPLICATION COMPILER CONTROLLER SINGLE PAGE ROUTING ENGINE (SPA)
// =========================================================================
window.navigate = function(viewId) {
    // Structural Visibility Mutation Interceptor
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.remove('active');
    });

    const targetViewportNode = document.getElementById(viewId);
    if (targetViewportNode) {
        targetViewportNode.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Adaptive Operational System Navigation Bars Visibility Mapping Interceptors
    const masterHeaderElement = document.getElementById('main-header');
    const primaryAppFooterElement = document.getElementById('global-application-footer');
    
    if (viewId === 'admin-dashboard-view') {
        masterHeaderElement.style.display = 'none';
        primaryAppFooterElement.style.display = 'none';
        loadAdminDashboardData();
    } else {
        masterHeaderElement.style.display = 'flex';
        primaryAppFooterElement.style.display = 'block';
    }

    if (viewId === 'public-leads-view') {
        initializeRealtimePublicLeadsStream();
    }
};

// =========================================================================
// INTERACTION STRUCTURAL HUD & SLIDER BEHAVIORS MODIFIERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    const loader = document.getElementById("loader");
    const progressBar = document.getElementById("progressBar");
    const scrollTopBtn = document.getElementById("scrollTop");

    // Close Mobile Menu overlay if navigation target choice occurs
    mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => mobileMenu.classList.remove("show"));
    });

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle("show");
        });
        document.addEventListener("click", () => mobileMenu.classList.remove("show"));
    }

    // Micro Operational Loader Timeout Simulation Control Link
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = "0";
            setTimeout(() => loader.style.display = "none", 500);
        }, 1000);
    }

    // Navigation and Scrolling Metrics Dynamic Tracker UI updates
    window.addEventListener("scroll", () => {
        if (window.scrollY > 40) {
            document.getElementById("main-header")?.classList.add("sticky");
        } else {
            document.getElementById("main-header")?.classList.remove("sticky");
        }

        let scrollRatioPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (progressBar) progressBar.style.width = scrollRatioPercentage + "%";

        if (window.scrollY > 300) {
            scrollTopBtn?.classList.add("active");
        } else {
            scrollTopBtn?.classList.remove("active");
        }
    });

    scrollTopBtn?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Onboarding Accordion Structural Actions Engine mapping loop
    document.querySelectorAll(".faq-question").forEach(item => {
        item.addEventListener("click", () => {
            item.parentElement?.classList.toggle("active");
        });
    });

    // Compile Static Elements data tracks arrays mapping
    renderTestimonialsTrackSystem();
    observeAuthStateStatusTracking();
});

// =========================================================================
// REAL-TIME FIRESTORE RECEPTION PIPELINES & CARDS RENDERING LOGIC
// =========================================================================
function initializeRealtimePublicLeadsStream() {
    const publicLeadsCollectionReference = collection(db, "leads");
    
    onSnapshot(publicLeadsCollectionReference, (querySnapshot) => {
        publicLeadsTrackingArray = [];
        querySnapshot.forEach((documentObject) => {
            publicLeadsTrackingArray.push({ id: documentObject.id, ...documentObject.data() });
        });
        renderPublicLeadsGridMatrix();
    }, (error) => {
        console.error("Critical Fault Intaking Live Leads Array Block Pipeline Hook: ", error);
    });
}

window.setLeadFilter = function(categoryTag) {
    currentFilterCategory = categoryTag;
    document.querySelectorAll("#categoryFilterContainer .filter-pill").forEach(pill => {
        pill.classList.remove("active");
        if(pill.getAttribute("onclick").includes(`'${categoryTag}'`)) {
            pill.classList.add("active");
        }
    });
    renderPublicLeadsGridMatrix();
};

function renderPublicLeadsGridMatrix() {
    const leadsViewportGridTarget = document.getElementById("publicLeadsGrid");
    if (!leadsViewportGridTarget) return;

    const targetedFilteredDataPool = currentFilterCategory === 'all' 
        ? publicLeadsTrackingArray 
        : publicLeadsTrackingArray.filter(lead => lead.category?.toLowerCase() === currentFilterCategory.toLowerCase());

    if (targetedFilteredDataPool.length === 0) {
        leadsViewportGridTarget.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #64748b;">
                <i class="fa-solid fa-folder-open" style="font-size: 44px; color: #cbd5e1; margin-bottom: 15px;"></i>
                <p>No active verified lead sets currently match the selected industry segment.</p>
            </div>`;
        return;
    }

    leadsViewportGridTarget.innerHTML = targetedFilteredDataPool.map(lead => `
        <div class="lead-card">
            <span class="lead-badge badge-${lead.category?.toLowerCase() || 'default'}">${lead.category || 'General Data Node'}</span>
            <h3>${lead.title || 'Premium Leads Batch'}</h3>
            <p>${lead.description || 'Verified prospects details mapping target profiles matching explicit specifications.'}</p>
            <div class="lead-meta">
                <span><i class="fa-solid fa-location-dot"></i> ${lead.location || 'United States'}</span>
                <span style="font-weight: 700; color: #143d73;">${lead.price || 'Pricing Matrix Inquire'}</span>
            </div>
            <button class="lead-action-btn" onclick="window.navigate('contact-view')">Acquire Active Lead Set</button>
        </div>
    `).join('');
}

// =========================================================================
// INBOUND PUBLIC REQUEST INTERFACE FORM CAPTURE SYSTEM
// =========================================================================
const publicInboundContactFormTarget = document.getElementById("publicContactForm");
if (publicInboundContactFormTarget) {
    publicInboundContactFormTarget.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const pipelinePayloadDataBlock = {
            name: document.getElementById("contact-name").value.trim(),
            email: document.getElementById("contact-email").value.trim(),
            phone: document.getElementById("contact-phone").value.trim(),
            message: document.getElementById("contact-message").value.trim(),
            status: "unassigned",
            timestamp: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "submissions"), pipelinePayloadDataBlock);
            alert("Security transmission verified. Your operational inquiry parameters have been logged.");
            publicInboundContactFormTarget.reset();
        } catch (faultExceptionError) {
            console.error("Critical Fault Dispatching Inbound Inquiries Payload Structural Object: ", faultExceptionError);
            alert("Pipeline Connection Reset Fault. Verify network operational paths.");
        }
    });
}

// =========================================================================
// ADMINISTRATIVE GATEKEEPER ACCOUNT AUTHENTICATION SUB-SYSTEM
// =========================================================================
const adminPortalLoginFormTarget = document.getElementById("adminLoginForm");
if (adminPortalLoginFormTarget) {
    adminPortalLoginFormTarget.addEventListener("submit", async (event) => {
        event.preventDefault();
        const authorizationEmailToken = document.getElementById("login-email").value.trim();
        const securitySecretKeyToken = document.getElementById("login-password").value.trim();

        try {
            await signInWithEmailAndPassword(auth, authorizationEmailToken, securitySecretKeyToken);
            adminPortalLoginFormTarget.reset();
            window.navigate("admin-dashboard-view");
        } catch (authenticationExceptionError) {
            console.error("Portal Authentication Crypt Refusal Countered: ", authenticationExceptionError);
            alert("Security Authentication Access Violation: Invalid identity signature keys parameters.");
        }
    });
}

const portalLogoutTriggerActionNode = document.getElementById("adminLogoutBtn");
if (portalLogoutTriggerActionNode) {
    portalLogoutTriggerActionNode.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.navigate("home-view");
        } catch (logoutFaultException) {
            console.error("Logout System Session Token Invalidation Error Event: ", logoutFaultException);
        }
    });
}

function observeAuthStateStatusTracking() {
    onAuthStateChanged(auth, (authenticatedUserNode) => {
        if (authenticatedUserNode) {
            console.log("Admin Identity Cleared: Authenticated Active Token Context Session Established.");
        } else {
            console.log("Context Security Warning: Session Active Context State Unsigned Root Level.");
        }
    });
}

// =========================================================================
// CRM MAIN DATA MANAGEMENT CONSOLE HUB VISUAL CONTROLLERS
// =========================================================================
window.switchAdminTab = function(targetTabContentId) {
    document.querySelectorAll(".crm-item").forEach(item => item.classList.remove("active"));
    document.querySelectorAll(".crm-tab-content").forEach(contentBlock => contentBlock.classList.remove("active"));

    const associatedMenuSelectionPill = document.querySelector(`.crm-item[data-tab="${targetTabContentId}"]`);
    if (associatedMenuSelectionPill) associatedMenuSelectionPill.classList.add("active");

    const targetedTabContainerView = document.getElementById(targetTabContentId);
    if (targetedTabContainerView) targetedTabContainerView.classList.add("active");
};

function loadAdminDashboardData() {
    // Realtime Hooks initialization loop vectors for Dashboard Tabs Matrices
    onSnapshot(collection(db, "leads"), (querySnapshot) => {
        let leadsRecordsArray = [];
        querySnapshot.forEach(docObj => leadsRecordsArray.push({ id: docObj.id, ...docObj.data() }));
        
        populateAdminLeadsInventoryInterface(leadsRecordsArray);
        compileDashboardMetricTrackCards(leadsRecordsArray, null);
    });

    onSnapshot(collection(db, "submissions"), (querySnapshot) => {
        let submissionsRecordsArray = [];
        querySnapshot.forEach(docObj => submissionsRecordsArray.push({ id: docObj.id, ...docObj.data() }));
        
        populateAdminInboundSubmissionsLogView(submissionsRecordsArray);
        renderKanbanPipelineControlBoard(submissionsRecordsArray);
        compileDashboardMetricTrackCards(null, submissionsRecordsArray);
    });
}

// Metric Compilation calculations mapping node updates
let historicalLeadsCounterCache = 0;
let historicalSubmissionsCounterCache = 0;

function compileDashboardMetricTrackCards(leadsBatchArray, submissionsBatchArray) {
    if (leadsBatchArray) historicalLeadsCounterCache = leadsBatchArray.length;
    if (submissionsBatchArray) historicalSubmissionsCounterCache = submissionsBatchArray.length;

    const statTotalLeadsNode = document.getElementById("stat-total-leads");
    const statPublishedLeadsNode = document.getElementById("stat-published-leads");
    const statTotalSubmissionsNode = document.getElementById("stat-total-submissions");
    const statConversionRateNode = document.getElementById("stat-conversion-rate");

    if (statTotalLeadsNode) statTotalLeadsNode.innerText = historicalLeadsCounterCache;
    if (statPublishedLeadsNode) statPublishedLeadsNode.innerText = historicalLeadsCounterCache;
    if (statTotalSubmissionsNode) statTotalSubmissionsNode.innerText = historicalSubmissionsCounterCache;
    
    if (statConversionRateNode && historicalLeadsCounterCache > 0) {
        let calculatedRatioMetric = Math.round((historicalSubmissionsCounterCache / historicalLeadsCounterCache) * 100);
        statConversionRateNode.innerText = `${calculatedRatioMetric}%`;
    }
}

function populateAdminLeadsInventoryInterface(leadsDataPool) {
    const targetTableContainerBodyNode = document.getElementById("adminLeadsTableBody");
    if (!targetTableContainerBodyNode) return;

    if (leadsDataPool.length === 0) {
        targetTableContainerBodyNode.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color: #94a3b8;">No lead parameters records allocated within the database space.</td></tr>`;
        return;
    }

    targetTableContainerBodyNode.innerHTML = leadsDataPool.map(lead => `
        <tr>
            <td style="font-weight: 600; color: #1e293b;">${lead.title || 'Unnamed Record Node'}</td>
            <td><span class="lead-badge badge-${lead.category?.toLowerCase() || 'default'}" style="margin:0;">${lead.category || 'General'}</span></td>
            <td>${lead.location || 'Global Bound Routing'}</td>
            <td style="font-weight:700; color: #1e293b;">${lead.price || 'TBD'}</td>
            <td><span class="status-pill status-active">Active Stream</span></td>
            <td>
                <button class="action-icon-btn btn-delete" onclick="deleteLeadRecordStructure('${lead.id}')" title="Delete Permanent Node"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `).join('');
}

function populateAdminInboundSubmissionsLogView(submissionsDataPool) {
    const targetSubmissionsTableBodyNode = document.getElementById("adminSubmissionsTableBody");
    if (!targetSubmissionsTableBodyNode) return;

    if (submissionsDataPool.length === 0) {
        targetSubmissionsTableBodyNode.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px; color: #94a3b8;">Queue clean. No pending user input payloads detected inside active threads.</td></tr>`;
        return;
    }

    targetSubmissionsTableBodyNode.innerHTML = submissionsDataPool.map(submission => {
        let parsingTimestampString = submission.timestamp?.toDate ? submission.timestamp.toDate().toLocaleString() : "Realtime Sync Tracking Process";
        return `
            <tr>
                <td style="font-weight: 600; color: #1e293b;">${submission.name || 'Anonymous Prospect'}</td>
                <td><a href="mailto:${submission.email}" style="color: #184e92; text-decoration:none;">${submission.email || 'N/A'}</a></td>
                <td>${submission.phone || 'N/A'}</td>
                <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-transform: ellipsis;" title="${submission.message}">${submission.message || 'No structural context message block specified.'}</td>
                <td style="font-size: 12px; color: #64748b;">${parsingTimestampString}</td>
            </tr>
        `;
    }).join('');
}

// =========================================================================
// PIPELINE MONITOR KANBAN CONTROLLER VISUAL STRUCTURAL MAPPING DATA
// =========================================================================
function renderKanbanPipelineControlBoard(submissionsDataPool) {
    const columnsPipelinesSelectorsMappingNodes = {
        unassigned: document.getElementById("kanban-unassigned"),
        processing: document.getElementById("kanban-processing"),
        won: document.getElementById("kanban-won")
    };

    const countLabelsSelectorsMappingNodes = {
        unassigned: document.getElementById("count-unassigned"),
        processing: document.getElementById("count-processing"),
        won: document.getElementById("count-won")
    };

    // Diagnostics clearing loops vectors
    Object.values(columnsPipelinesSelectorsMappingNodes).forEach(column => { if (column) column.innerHTML = ""; });
    Object.values(countLabelsSelectorsMappingNodes).forEach(label => { if (label) label.innerText = "0"; });

    let pipelinesCountersDistributionObjects = { unassigned: 0, processing: 0, won: 0 };

    submissionsDataPool.forEach(taskItem => {
        let taskStateAllocationFlag = taskItem.status || "unassigned";
        if (!columnsPipelinesSelectorsMappingNodes[taskStateAllocationFlag]) taskStateAllocationFlag = "unassigned";

        pipelinesCountersDistributionObjects[taskStateAllocationFlag]++;
        
        const cardStructuralNodeBuilder = document.createElement("div");
        cardStructuralNodeBuilder.className = "kanban-card";
        cardStructuralNodeBuilder.innerHTML = `
            <h3>${taskItem.name || 'Prospect Client'}</h3>
            <p>${taskItem.message || 'No parameters requirements detailed context.'}</p>
            <div class="kanban-card-footer">
                <span><i class="fa-solid fa-phone" style="margin-right:4px;"></i>${taskItem.phone || 'No Contact Data'}</span>
                <select onchange="updatePipelineNodeRouteState('${taskItem.id}', this.value)" style="padding: 4px; font-size: 11px; border-radius: 6px; background:#f8fafc; color:#334155; border:1px solid #cbd5e1;">
                    <option value="unassigned" ${taskStateAllocationFlag === 'unassigned' ? 'selected' : ''}>Node New</option>
                    <option value="processing" ${taskStateAllocationFlag === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="won" ${taskStateAllocationFlag === 'won' ? 'selected' : ''}>Authorized</option>
                </select>
            </div>
        `;
        columnsPipelinesSelectorsMappingNodes[taskStateAllocationFlag]?.appendChild(cardStructuralNodeBuilder);
    });

    Object.keys(countLabelsSelectorsMappingNodes).forEach(key => {
        if (countLabelsSelectorsMappingNodes[key]) countLabelsSelectorsMappingNodes[key].innerText = pipelinesCountersDistributionObjects[key];
    });
}

// =========================================================================
// ACTION LIFECYCLE MODAL CONTROL STRATEGIES & RECORD MUTATION OPERATIONS
// =========================================================================
window.openAddLeadModal = function() {
    document.getElementById("addLeadModalOverlay")?.classList.add("show");
};

window.closeAddLeadModal = function() {
    document.getElementById("addLeadModalOverlay")?.classList.remove("show");
};

const crmLeadAdditionExecutionFormTarget = document.getElementById("addLeadForm");
if (crmLeadAdditionExecutionFormTarget) {
    crmLeadAdditionExecutionFormTarget.addEventListener("submit", async (e) => {
        e.preventDefault();

        const customLeadStructuralDocBlockInstance = {
            title: document.getElementById("modal-title").value.trim(),
            category: document.getElementById("modal-category").value,
            location: document.getElementById("modal-location").value.trim(),
            price: document.getElementById("modal-price").value.trim(),
            description: document.getElementById("modal-desc").value.trim(),
            timestamp: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "leads"), customLeadStructuralDocBlockInstance);
            alert("Database Mutation Verified: Target Lead Array injected cleanly.");
            crmLeadAdditionExecutionFormTarget.reset();
            closeAddLeadModal();
        } catch (insertionFaultException) {
            console.error("Critical Failure Injecting Structural Document Record Instance Block: ", insertionFaultException);
            alert("Security Ledger Refusal Error Encountered. Verify access authority tokens parameters context.");
        }
    });
}

window.deleteLeadRecordStructure = async function(documentRecordIdentifierKey) {
    if (!confirm("Are you sure you want to permanently delete this lead record?")) return;
    try {
        await deleteDoc(doc(db, "leads", documentRecordIdentifierKey));
        alert("Lead record deleted successfully.");
    } catch (deletionExceptionError) {
        console.error("Critical Failure Processing Target Record Set Erasure Sequence: ", deletionExceptionError);
    }
};

window.updatePipelineNodeRouteState = async function(documentRecordIdentifierKey, targetStateTransitionToken) {
    try {
        const structuralTargetDocumentReference = doc(db, "submissions", documentRecordIdentifierKey);
        await updateDoc(structuralTargetDocumentReference, { status: targetStateTransitionToken });
        console.log(`State Route Mutation Successfully Committed to Firebase Pipeline: Node ID [${documentRecordIdentifierKey}] State -> ${targetStateTransitionToken}`);
    } catch (pipelineMutationFaultException) {
        console.error("Critical Mutation Refusal Intercepted from Database Engine System Loop: ", pipelineMutationFaultException);
    }
};

// =========================================================================
// CORE HARDCODED COMPREHENSIVE DATA TRACK RENDERING UTILITIES
// =========================================================================
function renderTestimonialsTrackSystem() {
    const dynamicTestimonialTrackTargetNode = document.getElementById("testimonialTrack");
    if (!dynamicTestimonialTrackTargetNode) return;

    const historicalOnboardedProfilesLedger = [
        { message: "QFY Leads helped us reach highly targeted insurance, medical, and telecom clients with excellent accuracy and compliance.", name: "Murtaza Siyahi", role: "Business Owner, Tasaif LLC", location: "Wyoming, United States" },
        { message: "The quality of leads provided helped our funding campaigns perform better. Strong understanding of financial services.", name: "Bryan J Duelley", role: "Owner, MY Company Funding LLC", location: "Texas, United States" },
        { message: "QFY Leads supported our expansion across medical and legal translation services with relevant and well-targeted leads.", name: "Yoni Ohayon", role: "CEO, eTranslationServices.com", location: "United States" },
        { message: "Consistent lead delivery and strong campaign understanding helped scale our healthcare-focused call center operations.", name: "William Marroquin", role: "CEO, HealthBrokersPro", location: "California, United States" },
        { message: "Their intent-based targeting helped accelerate conversions across finance and debt-related services.", name: "Alex Frias", role: "Investor & Entrepreneur, Hilldale Corp", location: "United States" },
        { message: "Reliable healthcare leads suitable for telemarketing and online outreach. Smooth coordination throughout.", name: "Jonatan Arano", role: "General Manager, Trusted Medical Providers", location: "Los Angeles Metro Area" }
    ];

    dynamicTestimonialTrackTargetNode.innerHTML = historicalOnboardedProfilesLedger.map(profile => `
        <div class="testimonial-card">
            <div class="quote"><i class="fa-solid fa-quote-left"></i></div>
            <div class="stars">★★★★★</div>
            <p>${profile.message}</p>
            <div class="client">
                <h4>${profile.name}</h4>
                <span>${profile.role}</span>
                <small>${profile.location}</small>
            </div>
        </div>
    `).join("");

    // Initialize Testimonials Carousel Execution Logic Track Loop Controllers Parameters
    let visualActivePointerIndexValue = 0;
    const clickNextActionControlTriggerNode = document.querySelector(".next");
    const clickPrevActionControlTriggerNode = document.querySelector(".prev");
    const baselineCardWidthBoundMetric = 405;

    function transitionCarouselTrack() {
        dynamicTestimonialTrackTargetNode.style.transform = `translateX(-${visualActivePointerIndexValue * baselineCardWidthBoundMetric}px)`;
    }

    clickNextActionControlTriggerNode?.addEventListener("click", () => {
        visualActivePointerIndexValue = (visualActivePointerIndexValue < historicalOnboardedProfilesLedger.length - 1) ? visualActivePointerIndexValue + 1 : 0;
        transitionCarouselTrack();
    });

    clickPrevActionControlTriggerNode?.addEventListener("click", () => {
        visualActivePointerIndexValue = (visualActivePointerIndexValue > 0) ? visualActivePointerIndexValue - 1 : historicalOnboardedProfilesLedger.length - 1;
        transitionCarouselTrack();
    });

    setInterval(() => {
        visualActivePointerIndexValue = (visualActivePointerIndexValue + 1) % historicalOnboardedProfilesLedger.length;
        transitionCarouselTrack();
    }, 4000);
}
