const STORAGE_KEYS = {
    printers: 'instprint_demo_printers',
    orders: 'instprint_demo_orders'
};

const ORDER_STATUS_FLOW = [
    'Pending',
    'Paid',
    'Accepted',
    'Printing',
    'Ready for Collection',
    'Completed',
    'Cancelled',
    'Failed'
];

const SAMPLE_PRINTERS = [
    {
        id: 'printer-1',
        displayName: 'Maya Home Print Hub',
        location: 'Clementi',
        postalCode: '120123',
        distanceKm: 2.4,
        blackWhitePrice: 0.15,
        colourPrice: 0.4,
        paperSizes: ['A4', 'Letter'],
        duplex: true,
        available: true,
        completionTime: '2-4 hours',
        rating: 4.8,
        printerModel: 'HP LaserJet Pro M404n',
        minOrder: 2,
        availability: 'Mon-Fri 6pm-10pm, Sat-Sun 10am-6pm',
        collectionInstructions: 'Please text me before pickup. I am at Block 123, Unit 04-05.'
    },
    {
        id: 'printer-2',
        displayName: 'Northpoint Print Corner',
        location: 'Woodlands',
        postalCode: '730001',
        distanceKm: 4.1,
        blackWhitePrice: 0.18,
        colourPrice: 0.45,
        paperSizes: ['A4', 'A3', 'Letter'],
        duplex: true,
        available: true,
        completionTime: '1-3 hours',
        rating: 4.6,
        printerModel: 'Canon imageRUNNER ADVANCE',
        minOrder: 3,
        availability: 'Tue-Sun 9am-8pm',
        collectionInstructions: 'Meet at the lift lobby. I can support urgent requests.'
    },
    {
        id: 'printer-3',
        displayName: 'Sunset Copy Station',
        location: 'Tampines',
        postalCode: '520023',
        distanceKm: 6.8,
        blackWhitePrice: 0.12,
        colourPrice: 0.36,
        paperSizes: ['A4', 'Legal', 'Letter'],
        duplex: false,
        available: false,
        completionTime: 'Same day',
        rating: 4.7,
        printerModel: 'Brother MFC-L8900CDW',
        minOrder: 1,
        availability: 'Weekdays 4pm-9pm',
        collectionInstructions: 'Collection from the main gate on request.'
    },
    {
        id: 'printer-4',
        displayName: 'Harbour Print House',
        location: 'Pasir Ris',
        postalCode: '510001',
        distanceKm: 5.3,
        blackWhitePrice: 0.16,
        colourPrice: 0.42,
        paperSizes: ['A4', 'A3', 'Legal'],
        duplex: true,
        available: true,
        completionTime: '2-5 hours',
        rating: 4.9,
        printerModel: 'Epson Workforce Pro',
        minOrder: 2,
        availability: 'Daily from 12pm-9pm',
        collectionInstructions: 'Collection after confirmation by text message.'
    }
];

const app = (() => {
    const state = {
        printers: [],
        orders: [],
        selectedPrinter: null,
        pendingCheckout: null,
        activeSection: 'home'
    };

    function formatMoney(amount) {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: 'SGD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(amount) || 0);
    }

    function safeJsonParse(raw) {
        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function readStorage(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            if (raw === null || raw === undefined) {
                return fallback;
            }
            const parsed = safeJsonParse(raw);
            return parsed !== null ? parsed : fallback;
        } catch (error) {
            console.warn('Storage unavailable:', error);
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Unable to save to localStorage:', error);
            return false;
        }
    }

    function ensureDefaultData() {
        const storedPrinters = readStorage(STORAGE_KEYS.printers, null);
        if (!Array.isArray(storedPrinters) || storedPrinters.length === 0) {
            state.printers = SAMPLE_PRINTERS.map((printer) => ({ ...printer }));
            writeStorage(STORAGE_KEYS.printers, state.printers);
        } else {
            state.printers = storedPrinters;
        }

        const storedOrders = readStorage(STORAGE_KEYS.orders, []);
        state.orders = Array.isArray(storedOrders) ? storedOrders : [];
    }

    function persistPrinters() {
        writeStorage(STORAGE_KEYS.printers, state.printers);
    }

    function persistOrders() {
        writeStorage(STORAGE_KEYS.orders, state.orders);
    }

    function showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach((section) => {
            section.classList.toggle('active', section.id === sectionId);
        });
        state.activeSection = sectionId;
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${sectionId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function navigateTo(sectionId) {
        showSection(sectionId);
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.classList.remove('open');
        }
    }

    function setUpNavigation() {
        document.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', (event) => {
                const target = link.getAttribute('href');
                if (target && target.startsWith('#')) {
                    event.preventDefault();
                    const id = target.replace('#', '');
                    if (id) {
                        showSection(id);
                    }
                }
            });
        });

        document.querySelector('.hamburger').addEventListener('click', () => {
            const navMenu = document.querySelector('.nav-menu');
            navMenu.classList.toggle('open');
        });
    }

    function getSelectedPrinterFromState() {
        const printerId = state.selectedPrinter ? state.selectedPrinter.id : null;
        return state.printers.find((printer) => printer.id === printerId) || null;
    }

    function getFilterOptions() {
        const searchValue = document.getElementById('searchLocation').value.trim().toLowerCase();
        const typeValue = document.getElementById('filterPrintType').value;
        const maxPriceValue = Number(document.getElementById('filterMaxPrice').value || 0);
        const availabilityValue = document.getElementById('filterAvailability').value;
        const sortValue = document.getElementById('sortBy').value;

        return { searchValue, typeValue, maxPriceValue, availabilityValue, sortValue };
    }

    function applyFilters() {
        const { searchValue, typeValue, maxPriceValue, availabilityValue, sortValue } = getFilterOptions();

        let filtered = [...state.printers];

        if (searchValue) {
            filtered = filtered.filter((printer) => {
                const searchable = [
                    printer.displayName,
                    printer.location,
                    printer.postalCode,
                    printer.printerModel
                ].join(' ').toLowerCase();
                return searchable.includes(searchValue);
            });
        }

        if (typeValue) {
            filtered = filtered.filter((printer) => {
                if (typeValue === 'bw') {
                    return true;
                }
                if (typeValue === 'colour') {
                    return true;
                }
                if (typeValue === 'both') {
                    return printer.blackWhitePrice > 0 && printer.colourPrice > 0;
                }
                return true;
            });
        }

        if (maxPriceValue > 0) {
            filtered = filtered.filter((printer) => {
                const minPrice = Math.min(printer.blackWhitePrice, printer.colourPrice);
                return minPrice <= maxPriceValue;
            });
        }

        if (availabilityValue === 'available') {
            filtered = filtered.filter((printer) => printer.available);
        }
        if (availabilityValue === 'unavailable') {
            filtered = filtered.filter((printer) => !printer.available);
        }

        switch (sortValue) {
            case 'price-desc':
                filtered.sort((a, b) => Math.min(a.blackWhitePrice, a.colourPrice) - Math.min(b.blackWhitePrice, b.colourPrice));
                filtered.reverse();
                break;
            case 'distance':
                filtered.sort((a, b) => a.distanceKm - b.distanceKm);
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'price-asc':
            default:
                filtered.sort((a, b) => Math.min(a.blackWhitePrice, a.colourPrice) - Math.min(b.blackWhitePrice, b.colourPrice));
                break;
        }

        renderPrinterListings(filtered);
    }

    function renderPrinterListings(filtered = state.printers) {
        const container = document.getElementById('printerListings');
        if (!container) {
            return;
        }

        if (!filtered.length) {
            container.innerHTML = '<p class="empty-state">No printers match your current search. Try widening the location or resetting the filters.</p>';
            return;
        }

        container.innerHTML = filtered.map((printer) => {
            const cheapestPrice = Math.min(printer.blackWhitePrice, printer.colourPrice);
            return `
                <article class="printer-card" data-printer-id="${printer.id}">
                    <div class="printer-card-header">
                        <div>
                            <h3>${printer.displayName}</h3>
                            <p class="meta-text">${printer.location} • ${printer.postalCode}</p>
                        </div>
                        <span class="badge ${printer.available ? 'available' : 'unavailable'}">${printer.available ? 'Available' : 'Unavailable'}</span>
                    </div>

                    <div class="printer-meta">
                        <div class="meta-item">
                            <strong>Illustrative distance</strong>
                            <span>${printer.distanceKm} km away</span>
                        </div>
                        <div class="meta-item">
                            <strong>Price</strong>
                            <span class="price-tag">from ${formatMoney(cheapestPrice)}/page</span>
                        </div>
                        <div class="meta-item">
                            <strong>Rating</strong>
                            <span>⭐ ${printer.rating} / 5</span>
                        </div>
                        <div class="meta-item">
                            <strong>Turnaround</strong>
                            <span>${printer.completionTime}</span>
                        </div>
                    </div>

                    <div class="printer-card-actions">
                        <button class="btn btn-primary" type="button" data-action="view-printer" data-printer-id="${printer.id}">View Details</button>
                        <button class="btn btn-outline" type="button" data-action="order-printer" data-printer-id="${printer.id}" ${printer.available ? '' : 'disabled'}>Order</button>
                    </div>
                </article>
            `;
        }).join('');
    }

    function viewPrinterInfo(printerId) {
        const printer = state.printers.find((item) => item.id === printerId);
        if (!printer) {
            return;
        }

        const modal = document.getElementById('printerDetailModal');
        const content = document.getElementById('printerDetailContent');

        content.innerHTML = `
            <h2>${printer.displayName}</h2>
            <p class="disclaimer"><strong>Demo listing only.</strong> This provider is not guaranteed to be active or currently accepting orders.</p>
            <div class="order-summary-grid">
                <div class="meta-item">
                    <strong>Location</strong>
                    <span>${printer.location}</span>
                </div>
                <div class="meta-item">
                    <strong>Approximate distance</strong>
                    <span>${printer.distanceKm} km</span>
                </div>
                <div class="meta-item">
                    <strong>Printer model</strong>
                    <span>${printer.printerModel}</span>
                </div>
                <div class="meta-item">
                    <strong>Rating</strong>
                    <span>⭐ ${printer.rating} / 5</span>
                </div>
                <div class="meta-item">
                    <strong>B&amp;W pricing</strong>
                    <span>${formatMoney(printer.blackWhitePrice)} per page</span>
                </div>
                <div class="meta-item">
                    <strong>Colour pricing</strong>
                    <span>${formatMoney(printer.colourPrice)} per page</span>
                </div>
                <div class="meta-item">
                    <strong>Paper sizes</strong>
                    <span>${printer.paperSizes.join(', ')}</span>
                </div>
                <div class="meta-item">
                    <strong>Duplex</strong>
                    <span>${printer.duplex ? 'Supported' : 'Not supported'}</span>
                </div>
                <div class="meta-item">
                    <strong>Availability</strong>
                    <span>${printer.available ? 'Available now' : 'Unavailable for now'}</span>
                </div>
                <div class="meta-item">
                    <strong>Estimated completion</strong>
                    <span>${printer.completionTime}</span>
                </div>
            </div>
            <div class="order-card-actions">
                <button class="btn btn-primary" type="button" data-action="order-printer" data-printer-id="${printer.id}" ${printer.available ? '' : 'disabled'}>Choose this Printer</button>
                <button class="btn btn-outline" type="button" data-close="printer-detail">Close</button>
            </div>
        `;

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    function resetFilters() {
        document.getElementById('searchLocation').value = '';
        document.getElementById('filterPrintType').value = '';
        document.getElementById('filterMaxPrice').value = '';
        document.getElementById('filterAvailability').value = '';
        document.getElementById('sortBy').value = 'price-asc';
        renderPrinterListings();
    }

    function searchPrinters() {
        applyFilters();
    }

    function openOrderForm(printerId) {
        const printer = state.printers.find((item) => item.id === printerId);
        if (!printer) {
            return;
        }

        state.selectedPrinter = printer;
        const form = document.getElementById('printOrderForm');

        document.getElementById('orderPages').value = '';
        document.getElementById('orderPrintType').value = '';
        document.getElementById('orderSided').value = '';
        document.getElementById('orderCopies').value = '1';
        document.getElementById('orderPaperSize').value = '';
        document.getElementById('orderNotes').value = '';
        document.getElementById('pdfUpload').value = '';
        document.getElementById('priceBreakdown').innerHTML = '';

        const modal = document.getElementById('orderFormModal');
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        form.dataset.printerId = printer.id;
    }

    function validateOrderForm() {
        const printer = getSelectedPrinterFromState();
        const pages = Number(document.getElementById('orderPages').value || 0);
        const copies = Number(document.getElementById('orderCopies').value || 0);
        const printType = document.getElementById('orderPrintType').value;
        const paperSize = document.getElementById('orderPaperSize').value;
        const sided = document.getElementById('orderSided').value;

        if (!printer) {
            throw new Error('Please choose a printer first.');
        }

        if (!pages || pages < 1) {
            throw new Error('Enter a valid number of pages.');
        }
        if (!copies || copies < 1) {
            throw new Error('Enter a valid number of copies.');
        }
        if (!printType) {
            throw new Error('Select a print type.');
        }
        if (!paperSize) {
            throw new Error('Select a paper size.');
        }
        if (!sided) {
            throw new Error('Select single or double-sided printing.');
        }

        const pdfInput = document.getElementById('pdfUpload');
        if (pdfInput && pdfInput.files && pdfInput.files[0]) {
            const file = pdfInput.files[0];
            const allowedTypes = ['application/pdf', 'application/octet-stream'];
            if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
                throw new Error('Please upload a PDF file only.');
            }
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('PDF upload is too large. Keep it under 10MB for this prototype.');
            }
        }
    }

    function calculateOrderPrice() {
        const printer = getSelectedPrinterFromState();
        if (!printer) {
            return;
        }

        const pages = Number(document.getElementById('orderPages').value || 0);
        const copies = Number(document.getElementById('orderCopies').value || 0);
        const printType = document.getElementById('orderPrintType').value;

        if (!pages || !copies || !printType) {
            document.getElementById('priceBreakdown').innerHTML = '<p class="empty-state">Complete the form to calculate the total.</p>';
            return;
        }

        const pricePerPage = printType === 'colour' ? printer.colourPrice : printer.blackWhitePrice;
        const printingSubtotal = pages * copies * pricePerPage;
        const customerServiceFee = 0.5;
        const customerTotal = printingSubtotal + customerServiceFee;
        const commission = printingSubtotal * 0.2;
        const providerEarnings = printingSubtotal - commission;

        document.getElementById('priceBreakdown').innerHTML = `
            <div class="price-breakdown-row"><span>Printing subtotal</span><strong>${formatMoney(printingSubtotal)}</strong></div>
            <div class="price-breakdown-row"><span>Customer service fee</span><strong>${formatMoney(customerServiceFee)}</strong></div>
            <div class="price-breakdown-row"><span>Customer total</span><strong>${formatMoney(customerTotal)}</strong></div>
            <div class="price-breakdown-row"><span>Platform commission (20%)</span><strong>${formatMoney(commission)}</strong></div>
            <div class="price-breakdown-row"><span>Provider earnings</span><strong>${formatMoney(providerEarnings)}</strong></div>
        `;
    }

    function openCheckoutFromOrder(event) {
        event.preventDefault();

        try {
            validateOrderForm();
            calculateOrderPrice();
        } catch (error) {
            alert(error.message);
            return;
        }

        const printer = getSelectedPrinterFromState();
        const pages = Number(document.getElementById('orderPages').value);
        const copies = Number(document.getElementById('orderCopies').value);
        const printType = document.getElementById('orderPrintType').value;
        const paperSize = document.getElementById('orderPaperSize').value;
        const sides = document.getElementById('orderSided').value;
        const notes = document.getElementById('orderNotes').value.trim();

        const subtotal = pages * copies * (printType === 'colour' ? printer.colourPrice : printer.blackWhitePrice);
        const serviceFee = 0.5;
        const total = subtotal + serviceFee;
        const commission = subtotal * 0.2;

        state.pendingCheckout = {
            printerId: printer.id,
            printerName: printer.displayName,
            location: printer.location,
            printType,
            pages,
            copies,
            paperSize,
            sides,
            notes,
            subtotal,
            serviceFee,
            total,
            commission,
            orderRef: `IP-${Date.now().toString().slice(-8)}`
        };

        document.getElementById('checkoutSummary').innerHTML = `
            <div class="order-summary-info">
                <h3>Order Reference: ${state.pendingCheckout.orderRef}</h3>
                <p><strong>Printer:</strong> ${printer.displayName}</p>
                <p><strong>Location:</strong> ${printer.location}</p>
                <p><strong>Print Settings:</strong> ${printType === 'colour' ? 'Colour' : 'Black & White'} • ${sides} • ${paperSize} • ${copies} copies</p>
                <div class="price-breakdown">
                    <div class="price-breakdown-row"><span>Printing subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
                    <div class="price-breakdown-row"><span>Service fee</span><strong>${formatMoney(serviceFee)}</strong></div>
                    <div class="price-breakdown-row"><span>Customer total</span><strong>${formatMoney(total)}</strong></div>
                    <div class="price-breakdown-row"><span>Platform commission</span><strong>${formatMoney(commission)}</strong></div>
                </div>
            </div>
        `;

        closeModal('orderFormModal');
        openModal('checkoutModal');
    }

    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
        }
    }

    function simulatePaymentSuccess() {
        if (!state.pendingCheckout) {
            return;
        }

        const order = {
            id: `order-${Date.now()}`,
            reference: state.pendingCheckout.orderRef,
            printerId: state.pendingCheckout.printerId,
            printerName: state.pendingCheckout.printerName,
            location: state.pendingCheckout.location,
            status: 'Paid',
            printType: state.pendingCheckout.printType,
            sides: state.pendingCheckout.sides,
            paperSize: state.pendingCheckout.paperSize,
            copies: state.pendingCheckout.copies,
            pages: state.pendingCheckout.pages,
            notes: state.pendingCheckout.notes,
            total: state.pendingCheckout.total,
            subtotal: state.pendingCheckout.subtotal,
            serviceFee: state.pendingCheckout.serviceFee,
            commission: state.pendingCheckout.commission,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        state.orders.unshift(order);
        persistOrders();
        closeModal('checkoutModal');

        const content = document.getElementById('confirmationContent');
        content.innerHTML = `
            <h2>Payment Successful</h2>
            <p>Your demo payment was simulated successfully.</p>
            <p><strong>Order Reference:</strong> ${order.reference}</p>
            <p><strong>Printer:</strong> ${order.printerName}</p>
            <p><strong>Amount Paid:</strong> ${formatMoney(order.total)}</p>
            <p><strong>Status:</strong> Paid (simulated)</p>
            <button class="btn btn-primary" type="button" data-action="navigate" data-target="my-orders">View Order History</button>
        `;
        openModal('confirmationModal');
        state.pendingCheckout = null;
        renderOrders();
        renderOwnerDashboard();
        renderAdminDashboard();
    }

    function simulatePaymentFailure() {
        if (!state.pendingCheckout) {
            return;
        }

        const order = {
            id: `order-${Date.now()}`,
            reference: state.pendingCheckout.orderRef,
            printerId: state.pendingCheckout.printerId,
            printerName: state.pendingCheckout.printerName,
            location: state.pendingCheckout.location,
            status: 'Failed',
            printType: state.pendingCheckout.printType,
            sides: state.pendingCheckout.sides,
            paperSize: state.pendingCheckout.paperSize,
            copies: state.pendingCheckout.copies,
            pages: state.pendingCheckout.pages,
            notes: state.pendingCheckout.notes,
            total: state.pendingCheckout.total,
            subtotal: state.pendingCheckout.subtotal,
            serviceFee: state.pendingCheckout.serviceFee,
            commission: state.pendingCheckout.commission,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        state.orders.unshift(order);
        persistOrders();
        closeModal('checkoutModal');

        const content = document.getElementById('confirmationContent');
        content.innerHTML = `
            <h2>Payment Failed</h2>
            <p>The demo checkout failed as expected for this prototype.</p>
            <p><strong>Order Reference:</strong> ${order.reference}</p>
            <p><strong>Status:</strong> Failed</p>
            <button class="btn btn-primary" type="button" data-action="navigate" data-target="my-orders">Return to Orders</button>
        `;
        openModal('confirmationModal');
        state.pendingCheckout = null;
        renderOrders();
        renderOwnerDashboard();
        renderAdminDashboard();
    }

    function renderOrders() {
        const orderHistory = document.getElementById('orderHistory');
        const ownerOrders = document.getElementById('ownerOrders');

        if (!orderHistory || !ownerOrders) {
            return;
        }

        const orders = [...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const renderList = (ordersToRender, target) => {
            if (!ordersToRender.length) {
                target.innerHTML = '<p class="empty-state">No demo orders available yet.</p>';
                return;
            }

            target.innerHTML = ordersToRender.map((order) => {
                const status = order.status || 'Pending';
                const nextStatus = getNextStatus(status);
                return `
                    <article class="order-card">
                        <div class="order-card-header">
                            <div>
                                <h3>${order.reference}</h3>
                                <p>${order.printerName}</p>
                            </div>
                            <span class="badge ${status.toLowerCase().replace(/\s+/g, '')} ${status === 'Paid' ? 'paidsimulated' : ''}">${status === 'Paid' ? 'Paid (simulated)' : status}</span>
                        </div>
                        <div class="order-summary-grid">
                            <div class="meta-item"><strong>Print settings</strong><span>${order.printType === 'colour' ? 'Colour' : 'Black & White'} • ${order.sides} • ${order.paperSize}</span></div>
                            <div class="meta-item"><strong>Copies</strong><span>${order.copies}</span></div>
                            <div class="meta-item"><strong>Pages</strong><span>${order.pages}</span></div>
                            <div class="meta-item"><strong>Price</strong><span>${formatMoney(order.total)}</span></div>
                        </div>
                        <div class="status-actions">
                            <button class="btn btn-outline" type="button" data-action="advance-order-status" data-order-id="${order.id}">Advance Status${nextStatus ? `: ${nextStatus}` : ''}</button>
                        </div>
                    </article>
                `;
            }).join('');
        };

        renderList(orders, orderHistory);
        const ownerListingOrders = orders.filter((order) => {
            const printerList = state.printers.map((printer) => printer.id);
            return printerList.includes(order.printerId);
        });
        renderList(ownerListingOrders, ownerOrders);
    }

    function getNextStatus(currentStatus) {
        if (!currentStatus) {
            return 'Paid';
        }

        const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
        if (currentIndex === -1) {
            return 'Paid';
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex >= ORDER_STATUS_FLOW.length) {
            return null;
        }
        return ORDER_STATUS_FLOW[nextIndex];
    }

    function advanceOrderStatus(orderId) {
        const order = state.orders.find((item) => item.id === orderId);
        if (!order) {
            return;
        }

        const nextStatus = getNextStatus(order.status || 'Pending');
        if (!nextStatus) {
            return;
        }

        order.status = nextStatus;
        order.updatedAt = new Date().toISOString();
        persistOrders();
        renderOrders();
        renderOwnerDashboard();
        renderAdminDashboard();
    }

    function renderPrinterOwnerListings() {
        const container = document.getElementById('myPrinterListings');
        if (!container) {
            return;
        }

        if (!state.printers.length) {
            container.innerHTML = '<p class="empty-state">No printer listings added yet.</p>';
            return;
        }

        container.innerHTML = state.printers.map((printer) => `
            <article class="owner-listing">
                <div class="owner-listing-header">
                    <div>
                        <h3>${printer.displayName}</h3>
                        <p>${printer.location}</p>
                    </div>
                    <span class="badge ${printer.available ? 'available' : 'unavailable'}">${printer.available ? 'Available' : 'Unavailable'}</span>
                </div>

                <div class="switch-row">
                    <strong>Availability</strong>
                    <label class="switch">
                        <input type="checkbox" data-printer-toggle="${printer.id}" ${printer.available ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="price-edit">
                    <div>
                        <label for="bw-${printer.id}">B&amp;W / page</label>
                        <input id="bw-${printer.id}" type="number" min="0.01" step="0.01" value="${printer.blackWhitePrice}" data-printer-bw="${printer.id}">
                    </div>
                    <div>
                        <label for="colour-${printer.id}">Colour / page</label>
                        <input id="colour-${printer.id}" type="number" min="0.01" step="0.01" value="${printer.colourPrice}" data-printer-colour="${printer.id}">
                    </div>
                </div>

                <div class="owner-listing-actions">
                    <button class="btn btn-outline" type="button" data-action="view-printer" data-printer-id="${printer.id}">View</button>
                    <button class="btn btn-danger" type="button" data-action="delete-printer" data-printer-id="${printer.id}">Remove</button>
                </div>
            </article>
        `).join('');
    }

    function renderOwnerDashboard() {
        const activePrinters = state.printers.filter((printer) => printer.available).length;
        const totalOrders = state.orders.length;
        const printingValue = state.orders.reduce((sum, order) => sum + (Number(order.subtotal) || 0), 0);
        const providerEarnings = state.orders.reduce((sum, order) => sum + ((Number(order.subtotal) || 0) - (Number(order.commission) || 0)), 0);

        document.getElementById('activePrinters').textContent = String(activePrinters);
        document.getElementById('totalOrders').textContent = String(totalOrders);
        document.getElementById('totalPrintingValue').textContent = formatMoney(printingValue);
        document.getElementById('totalEarnings').textContent = formatMoney(providerEarnings);

        renderPrinterOwnerListings();
        renderOrders();
    }

    function renderAdminDashboard() {
        const printingValue = state.orders.reduce((sum, order) => sum + (Number(order.subtotal) || 0), 0);
        const platformRevenue = state.orders.reduce((sum, order) => {
            const commission = Number(order.commission) || 0;
            const serviceFee = Number(order.serviceFee) || 0;
            return sum + commission + serviceFee;
        }, 0);
        const providerEarnings = state.orders.reduce((sum, order) => {
            const subtotal = Number(order.subtotal) || 0;
            const commission = Number(order.commission) || 0;
            return sum + (subtotal - commission);
        }, 0);
        const serviceFees = state.orders.reduce((sum, order) => sum + (Number(order.serviceFee) || 0), 0);

        document.getElementById('adminTotalPrinters').textContent = String(state.printers.length);
        document.getElementById('adminTotalOrders').textContent = String(state.orders.length);
        document.getElementById('adminPrintingValue').textContent = formatMoney(printingValue);
        document.getElementById('adminPlatformRevenue').textContent = formatMoney(platformRevenue);
        document.getElementById('adminProviderEarnings').textContent = formatMoney(providerEarnings);
        document.getElementById('adminServiceFees').textContent = formatMoney(serviceFees);

        const summary = {};
        ORDER_STATUS_FLOW.forEach((status) => {
            summary[status] = state.orders.filter((order) => (order.status || 'Pending') === status).length;
        });

        const summaryContainer = document.getElementById('adminOrderSummary');
        summaryContainer.innerHTML = Object.entries(summary).map(([status, value]) => `
            <div class="order-card">
                <div class="order-card-header">
                    <h3>${status}</h3>
                    <span class="badge ${status.toLowerCase().replace(/\s+/g, '')}">${value}</span>
                </div>
            </div>
        `).join('');
    }

    function registerPrinter(event) {
        event.preventDefault();

        const displayName = document.getElementById('displayName').value.trim();
        const location = document.getElementById('location').value.trim();
        const printerModel = document.getElementById('printerModel').value.trim();
        const paperSizes = [...document.querySelectorAll('input[name="paperSize"]:checked')].map((checkbox) => checkbox.value);
        const blackWhitePrice = Number(document.getElementById('bwPrice').value);
        const colourPrice = Number(document.getElementById('colourPrice').value);
        const duplex = document.getElementById('duplexSupport').checked;
        const availabilityText = document.getElementById('availability').value.trim();
        const minOrder = Number(document.getElementById('minOrder').value || 0);
        const collectionInstructions = document.getElementById('collectionInstructions').value.trim();

        if (!displayName || !location || !printerModel || !paperSizes.length || !blackWhitePrice || !colourPrice) {
            alert('Please complete all required fields before registering a listing.');
            return;
        }

        const newPrinter = {
            id: `printer-${Date.now()}`,
            displayName,
            location,
            postalCode: location,
            distanceKm: Number((Math.random() * 8 + 1).toFixed(1)),
            blackWhitePrice,
            colourPrice,
            paperSizes,
            duplex,
            available: true,
            completionTime: '2-6 hours',
            rating: 4.7,
            printerModel,
            minOrder,
            availability: availabilityText || 'Flexible schedule',
            collectionInstructions: collectionInstructions || 'Please contact before pickup.',
            createdAt: new Date().toISOString()
        };

        state.printers.unshift(newPrinter);
        persistPrinters();
        event.target.reset();
        renderPrinterListings();
        renderOwnerDashboard();
        renderAdminDashboard();
        navigateTo('owner-dashboard');
    }

    function handleOwnerActions(event) {
        const toggle = event.target.closest('[data-printer-toggle]');
        if (toggle) {
            const printer = state.printers.find((item) => item.id === toggle.dataset.printerToggle);
            if (!printer) return;
            printer.available = toggle.checked;
            persistPrinters();
            renderOwnerDashboard();
            renderPrinterListings();
            renderAdminDashboard();
            return;
        }

        const bwField = event.target.closest('[data-printer-bw]');
        if (bwField) {
            const printer = state.printers.find((item) => item.id === bwField.dataset.printerBw);
            if (!printer) return;
            printer.blackWhitePrice = Number(bwField.value || 0) || 0;
            persistPrinters();
            renderOwnerDashboard();
            renderPrinterListings();
            renderAdminDashboard();
            return;
        }

        const colourField = event.target.closest('[data-printer-colour]');
        if (colourField) {
            const printer = state.printers.find((item) => item.id === colourField.dataset.printerColour);
            if (!printer) return;
            printer.colourPrice = Number(colourField.value || 0) || 0;
            persistPrinters();
            renderOwnerDashboard();
            renderPrinterListings();
            renderAdminDashboard();
            return;
        }

        const deleteButton = event.target.closest('[data-action="delete-printer"]');
        if (deleteButton) {
            const printerId = deleteButton.dataset.printerId;
            state.printers = state.printers.filter((printer) => printer.id !== printerId);
            persistPrinters();
            renderOwnerDashboard();
            renderPrinterListings();
            renderAdminDashboard();
            return;
        }

        const targetOrderId = event.target.closest('[data-action="advance-order-status"]')?.dataset.orderId;
        if (targetOrderId) {
            advanceOrderStatus(targetOrderId);
            return;
        }
    }

    function exportDemoData() {
        const blob = new Blob([JSON.stringify({ printers: state.printers, orders: state.orders }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'instprint-demo-data.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    function clearAllDemoData() {
        const confirmed = window.confirm('Clear all demo data from localStorage? This cannot be undone.');
        if (!confirmed) {
            return;
        }

        state.printers = SAMPLE_PRINTERS.map((printer) => ({ ...printer }));
        state.orders = [];
        persistPrinters();
        persistOrders();
        renderPrinterListings();
        renderOwnerDashboard();
        renderAdminDashboard();
        navigateTo('home');
    }

    function bindEvents() {
        document.addEventListener('click', (event) => {
            const actionTarget = event.target.closest('[data-action]');
            if (!actionTarget) {
                return;
            }

            const action = actionTarget.dataset.action;
            const targetId = actionTarget.dataset.target;
            const printerId = actionTarget.dataset.printerId;

            if (action === 'navigate' && targetId) {
                navigateTo(targetId);
                return;
            }

            if (action === 'search-printers') {
                searchPrinters();
                return;
            }

            if (action === 'reset-filters') {
                resetFilters();
                return;
            }

            if (action === 'view-printer' && printerId) {
                viewPrinterInfo(printerId);
                return;
            }

            if (action === 'order-printer' && printerId) {
                openOrderForm(printerId);
                closeModal('printerDetailModal');
                return;
            }

            if (action === 'payment-success') {
                simulatePaymentSuccess();
                return;
            }

            if (action === 'payment-failure') {
                simulatePaymentFailure();
                return;
            }

            if (action === 'export-demo-data') {
                exportDemoData();
                return;
            }

            if (action === 'clear-demo-data') {
                clearAllDemoData();
                return;
            }
        });

        document.addEventListener('change', (event) => {
            const target = event.target;
            if (target.matches('#filterPrintType') || target.matches('#filterMaxPrice') || target.matches('#filterAvailability') || target.matches('#sortBy')) {
                applyFilters();
            }
            if (target.matches('#orderPrintType') || target.matches('#orderCopies') || target.matches('#orderPages')) {
                calculateOrderPrice();
            }
        });

        document.addEventListener('input', (event) => {
            const target = event.target;
            if (target.matches('#searchLocation')) {
                applyFilters();
            }
            if (target.matches('#orderPrintType') || target.matches('#orderCopies') || target.matches('#orderPages')) {
                calculateOrderPrice();
            }
        });

        document.addEventListener('submit', (event) => {
            if (event.target && event.target.id === 'printerForm') {
                registerPrinter(event);
            }

            if (event.target && event.target.id === 'printOrderForm') {
                openCheckoutFromOrder(event);
            }
        });

        document.addEventListener('click', (event) => {
            const closeTrigger = event.target.closest('[data-close]');
            if (!closeTrigger) {
                return;
            }

            const targetModal = closeTrigger.dataset.close;
            if (targetModal === 'printer-detail') {
                closeModal('printerDetailModal');
            } else if (targetModal === 'order-form') {
                closeModal('orderFormModal');
            } else if (targetModal === 'checkout') {
                closeModal('checkoutModal');
            } else if (targetModal === 'confirmation') {
                closeModal('confirmationModal');
            }
        });

        document.addEventListener('click', handleOwnerActions);
    }

    function init() {
        ensureDefaultData();
        setUpNavigation();
        bindEvents();
        renderPrinterListings(state.printers);
        renderOrders();
        renderOwnerDashboard();
        renderAdminDashboard();
        showSection('home');
    }

    return {
        init,
        searchPrinters,
        applyFilters,
        resetFilters,
        navigateTo,
        calculateOrderPrice,
        simulatePaymentSuccess,
        simulatePaymentFailure,
        clearAllDemoData,
        exportDemoData,
        renderOrders,
        renderOwnerDashboard,
        renderAdminDashboard,
        closeModal,
        openOrderForm,
        openCheckoutFromOrder,
        admin: { exportData: exportDemoData, clearData: clearAllDemoData },
        state
    };
})();

document.addEventListener('DOMContentLoaded', app.init);
window.app = app;
window.navigateTo = app.navigateTo;
