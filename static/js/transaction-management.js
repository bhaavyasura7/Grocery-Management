document.addEventListener('DOMContentLoaded', function () {
    const activeTransactionBtn = document.getElementById('activeTransactionBtn');
    const pausedTransactionBtn = document.getElementById('pausedTransactionBtn');
    const activeTransactionView = document.getElementById('activeTransactionView');
    const pausedTransactionView = document.getElementById('pausedTransactionView');
    const pauseTransactionBtn = document.getElementById('pauseTransactionBtn');
    const generateBillBtn = document.getElementById('generateBillBtn');
    const cancelTransactionBtn = document.getElementById('cancelTransactionBtn');
    const buyerNameInput = document.getElementById('buyer_name');
    const buyerMobileInput = document.getElementById('buyer_mobile');

    // Store the current transaction state
    let currentTransactionId = null;
    
    // Flag to prevent multiple simultaneous operations
    window.isResumingTransaction = false;

    // Initialize cart manager
    const cartManager = new CartManager();
    
    // Function to attach event listeners to resume buttons
    function attachResumeEventListeners() {
        document.querySelectorAll('.resume-transaction-btn').forEach(button => {
            // Remove any existing event listeners to prevent duplicates
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add fresh event listener
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                const transactionId = this.getAttribute('data-transaction-id');
                if (transactionId) {
                    resumeTransaction(transactionId);
                }
            });
        });
    }
    
    // Call this function on page load to ensure buttons work initially
    setTimeout(attachResumeEventListeners, 100);
    
    // Refresh paused transactions periodically to keep the list updated    setInterval(refreshPausedTransactions, 30000); // Refresh every 30 seconds
    
    // Function to show alerts
    function showAlert(message, type = 'info') {
        const alertContainer = document.querySelector('.alert-container');
        if (!alertContainer) {
            console.error('Alert container not found');
            return;
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertContainer.appendChild(alertDiv);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }

    // Function to refresh paused transactions
    async function refreshPausedTransactions() {
        try {
            const response = await fetch('/cashier/paused_transactions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            updatePausedTransactionsList(data.transactions);
        } catch (error) {
            console.error('Error refreshing paused transactions:', error);
            showAlert('Error refreshing paused transactions: ' + error.message, 'danger');
        }
    }

    // Function to update paused transactions list
    function updatePausedTransactionsList(transactions) {
        const pausedTransactionsTable = document.querySelector('#pausedTransactionView table tbody');
        if (!pausedTransactionsTable) return;

        // Clear existing rows
        pausedTransactionsTable.innerHTML = '';

        if (transactions && transactions.length > 0) {
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transaction.pause_time}</td>
                    <td>${transaction.buyer_name}</td>
                    <td>${transaction.buyer_mobile}</td>
                    <td>₹${transaction.total_amount.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary resume-transaction-btn" data-transaction-id="${transaction.id}">
                            <i class="fas fa-play me-1"></i> Resume
                        </button>
                    </td>
                `;
                pausedTransactionsTable.appendChild(row);
            });

            // Re-attach event listeners to the new buttons
            attachResumeEventListeners();
        } else {
            // Show a message if no paused transactions
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center">No paused transactions found</td>`;
            pausedTransactionsTable.appendChild(row);
        }
    }

    // Function to switch between views with smooth transitions
    function switchView(showActive) {
        if (showActive) {
            activeTransactionView.style.display = 'block';
            pausedTransactionView.style.display = 'none';
            activeTransactionBtn.classList.add('active');
            pausedTransactionBtn.classList.remove('active');
            // Clear current transaction when switching to active view
            currentTransactionId = null;
        } else {
            activeTransactionView.style.display = 'none';
            pausedTransactionView.style.display = 'block';
            activeTransactionBtn.classList.remove('active');
            pausedTransactionBtn.classList.add('active');
        }
    }

    // Function to pause transaction with validation
    function pauseTransaction() {
        const buyerName = buyerNameInput.value.trim();
        const buyerMobile = buyerMobileInput.value.trim();

        // Enhanced validation for customer details
        if (!buyerName || !buyerMobile) {
            showError('Please enter customer details before pausing the transaction.');
            return;
        }

        // Validate mobile number format
        if (!/^[6-9]\d{9}$/.test(buyerMobile)) {
            showError('Please enter a valid 10-digit mobile number starting with 6-9.');
            return;
        }

        // Check if there are items in the cart
        const cartItems = document.querySelectorAll('#activeTransactionView table tbody tr:not(:last-child)');
        if (!cartItems || cartItems.length === 0) {
            showError('Cannot pause an empty transaction. Please add items first.');
            return;
        }

        // Show loading state
        const pauseBtn = document.getElementById('pauseTransactionBtn');
        const originalBtnText = pauseBtn.innerHTML;
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Pausing...';

        // Collect cart data
        const cartData = Array.from(cartItems).map(row => ({
            name: row.cells[0].textContent,
            quantity: parseInt(row.cells[1].textContent),
            price: parseFloat(row.cells[2].textContent.replace('₹', ''))
        }));

        fetch('/cashier/pause_transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                buyer_name: buyerName,
                buyer_mobile: buyerMobile,
                cart_items: cartData
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || `HTTP error! status: ${response.status}`);
                    }).catch(() => {
                        // If JSON parsing fails, try to get text content
                        return response.text().then(text => {
                            // Check if response is HTML
                            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                                throw new Error('Received HTML response instead of JSON');
                            }
                            throw new Error(`Server error: ${text || response.statusText}`);
                        });
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Show success message
                    showSuccess('Transaction paused successfully! Starting a new transaction...');
                    
                    // Clear form fields and cart
                    buyerNameInput.value = '';
                    buyerMobileInput.value = '';
                    
                    // Reset the cart view to prepare for a new transaction
                    const cartContainer = document.querySelector('#activeTransactionView table tbody');
                    if (cartContainer) {
                        // Get the total row
                        const totalRow = cartContainer.querySelector('tr:last-child');
                        // Completely clear the cart container
                        cartContainer.innerHTML = '';
                        // Re-add only the total row
                        if (totalRow) {
                            cartContainer.appendChild(totalRow);
                            // Reset the total to zero
                            const totalCell = totalRow.querySelector('td:last-child');
                            if (totalCell) {
                                totalCell.innerHTML = '<strong>₹0.00</strong>';
                            }
                        }
                    }
                    
                    // Also clear any items that might be in the cart manager
                    if (cartManager && typeof cartManager.clearCart === 'function') {
                        cartManager.clearCart();
                    }
                    
                    // Reset button state
                    pauseBtn.disabled = false;
                    pauseBtn.innerHTML = originalBtnText;
                    
                    // Automatically redirect to start a new transaction
                    setTimeout(() => {
                        window.location.href = '/cashier';
                    }, 1000); // Longer delay to show the success message
                } else {
                    throw new Error(data.message || 'Failed to pause transaction');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError(`An error occurred while pausing the transaction: ${error.message}`);
                // Reset button state
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = originalBtnText;
            });
    }

    // Helper function to show errors in a more user-friendly way
    function showError(message) {
        const container = document.querySelector('.container');
        const existingAlert = container.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger animate__animated animate__fadeIn';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${message}`;
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => {
            alertDiv.classList.add('animate__fadeOut');
            setTimeout(() => alertDiv.remove(), 500);
        }, 4500);
    }

    // Helper function to show success messages in a user-friendly way
    function showSuccess(message) {
        const container = document.querySelector('.container');
        const existingAlert = container.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success animate__animated animate__fadeIn';
        alertDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i>${message}`;
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => {
            alertDiv.classList.add('animate__fadeOut');
            setTimeout(() => alertDiv.remove(), 500);
        }, 4500);
    }

    // Function to resume transaction with state management
    function resumeTransaction(transactionId) {
        // Prevent multiple resume attempts
        if (window.isResumingTransaction) {
            showError('A transaction is already being resumed. Please wait.');
            return;
        }

        window.isResumingTransaction = true;
        currentTransactionId = transactionId;

        // Show loading state on the resume button
        const resumeBtn = document.querySelector(`[data-transaction-id="${transactionId}"]`);
        const originalBtnText = resumeBtn.innerHTML;
        resumeBtn.disabled = true;
        resumeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Resuming...';

        // Set timeout for the request
        const timeoutDuration = 30000; // 30 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
        
        // Add retry mechanism
        let retryCount = 0;
        const maxRetries = 2;

        function attemptFetch() {
            return fetch(`/cashier/resume_transaction/${transactionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal,
                credentials: 'same-origin' // Ensure cookies are sent with the request
            })
            .then(response => {
                if (response.status === 401) {
                    // Session expired
                    window.location.href = '/login';
                    throw new Error('Session expired. Please login again.');
                }
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || `HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            });
        }
        
        attemptFetch()
            .catch(error => {
                // Retry logic for network errors or 5xx server errors
                if (retryCount < maxRetries && 
                    (error.name === 'TypeError' || 
                     (error.message && error.message.includes('HTTP error! status: 5')))) {
                    retryCount++;
                    console.log(`Retrying resume transaction (${retryCount}/${maxRetries})...`);
                    return new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
                        .then(attemptFetch);
                }
                throw error; // If we've exhausted retries or it's not a retriable error
            })
            .then(response => {
                clearTimeout(timeoutId);
                return response;
            })
            .then(data => {
                if (data.success) {
                    // Update buyer information if available
                    if (data.buyer_info) {
                        buyerNameInput.value = data.buyer_info.name || '';
                        buyerMobileInput.value = data.buyer_info.mobile || '';
                    }
                    
                    // Switch to active view
                    switchView(true);
                    
                    // Clear any existing error messages
                    const existingAlerts = document.querySelectorAll('.alert');
                    existingAlerts.forEach(alert => alert.remove());
                    
                    // Redirect with a longer delay to ensure state is properly updated
                    setTimeout(() => {
                        // Always redirect to cashier dashboard to avoid 404 errors
                        window.location.href = '/cashier';
                    }, 500);
                } else {
                    throw new Error(data.message || 'Failed to resume transaction');
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error('Error:', error);
                if (error.name === 'AbortError') {
                    showError('The request timed out. Please try again.');
                } else if (retryCount >= maxRetries) {
                    showError(`Failed to resume transaction after ${maxRetries} attempts. Please try again later.`);
                } else {
                    showError(`An error occurred while resuming the transaction: ${error.message}`);
                }
                // Reset button state
                resumeBtn.disabled = false;
                resumeBtn.innerHTML = originalBtnText;
                currentTransactionId = null;
            })
            .finally(() => {
                window.isResumingTransaction = false;
            });
    }

    // Add click event listeners
    activeTransactionBtn.addEventListener('click', () => switchView(true));
    pausedTransactionBtn.addEventListener('click', () => switchView(false));

    if (pauseTransactionBtn) {
        pauseTransactionBtn.addEventListener('click', pauseTransaction);
    }
    
    // Add event listener for cancel transaction button
    if (cancelTransactionBtn) {
        cancelTransactionBtn.addEventListener('click', function() {
            // Check if there are items in the cart
            const cartItems = document.querySelectorAll('#activeTransactionView table tbody tr:not(:last-child)');
            if (!cartItems || cartItems.length === 0) {
                showError('Cannot cancel an empty transaction.');
                return;
            }
            
            // Show the confirmation modal
            const cancelModal = new bootstrap.Modal(document.getElementById('cancelTransactionModal'));
            cancelModal.show();
        });
    }
    
    // Add event listener for the confirm cancel button in the modal
    const confirmCancelTransactionBtn = document.querySelector('#cancelTransactionModal .btn-warning');
    if (confirmCancelTransactionBtn) {
        confirmCancelTransactionBtn.addEventListener('click', function() {
            // Get all cart items before clearing
            const cartItems = document.querySelectorAll('#activeTransactionView table tbody tr:not(:last-child)');
            const itemsToRestore = [];
            
            // Collect item data to restore inventory
            cartItems.forEach(row => {
                const itemName = row.cells[0].textContent;
                const quantity = parseInt(row.cells[1].textContent);
                const price = parseFloat(row.cells[2].textContent.replace('₹', ''));
                
                // Find the product ID from the name
                const productSelect = document.getElementById('item_id');
                if (productSelect) {
                    for (let i = 0; i < productSelect.options.length; i++) {
                        const option = productSelect.options[i];
                        if (option.textContent.includes(itemName)) {
                            const productId = parseInt(option.value);
                            // Only add the item if we have a valid product ID
                            if (!isNaN(productId) && productId > 0) {
                                itemsToRestore.push({
                                    id: productId,
                                    name: itemName,
                                    quantity: quantity
                                });
                            }
                            break;
                        }
                    }
                }
            });
            
            // Send request to restore inventory
            if (itemsToRestore.length > 0) {
                fetch('/cashier/restore_inventory', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        items: itemsToRestore
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        // Update the product select options to reflect the restored stock
                        itemsToRestore.forEach(item => {
                            restoreProductStock(item.id, item.quantity);
                        });
                        
                        // Show success message
                        showSuccess('Transaction canceled and inventory restored successfully!');
                    } else {
                        throw new Error(data.message || 'Failed to restore inventory');
                    }
                })
                .catch(error => {
                    console.error('Error restoring inventory:', error);
                    showError(`An error occurred while restoring inventory: ${error.message}`);
                });
            }
        });
    }
    
    // Function to restore product stock in the select dropdown
    function restoreProductStock(productId, quantity) {
        const productSelect = document.getElementById('item_id');
        if (!productSelect) return;
        
        // Find the option with the matching product ID
        for (let i = 0; i < productSelect.options.length; i++) {
            const option = productSelect.options[i];
            if (option.value === productId) {
                // Extract the current stock value
                const stockMatch = option.textContent.match(/Stock: (\d+)/);
                if (stockMatch) {
                    const currentStock = parseInt(stockMatch[1]);
                    const newStock = currentStock + quantity;
                    
                    // Update the option text with the new stock value
                    option.textContent = option.textContent.replace(
                        /Stock: \d+/,
                        `Stock: ${newStock}`
                    );
                }
                break;
            }
        }
    }

    // Function to update cart view
    function updateCartView(cartItems) {
        const cartTable = document.querySelector('#activeTransactionView table tbody');
        if (!cartTable) return;

        // Clear existing rows except the total row
        const totalRow = cartTable.querySelector('tr:last-child');
        cartTable.innerHTML = '';
        if (totalRow) {
            cartTable.appendChild(totalRow);
        }

        let total = 0;

        cartItems.forEach(item => {
            const row = document.createElement('tr');
            row.setAttribute('data-item-id', item.id); // Add item ID to the row
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-danger remove-item-btn" data-item-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            cartTable.insertBefore(row, totalRow);
            total += item.quantity * item.price;
        });

        // Update total
        if (totalRow) {
            const totalCell = totalRow.querySelector('td:last-child');
            if (totalCell) {
                totalCell.innerHTML = `<strong>₹${total.toFixed(2)}</strong>`;
            }
        }

        // Attach event listeners to remove buttons
        attachRemoveButtonListeners();
    }

    // Function to generate bill
    function generateBill() {
        const buyerName = document.getElementById('buyer_name').value.trim();
        const buyerMobile = document.getElementById('buyer_mobile').value.trim();

        if (!buyerName || !buyerMobile) {
            showAlert('Please enter customer details', 'warning');
            return;
        }

        const cartRows = document.querySelectorAll('#activeTransactionView table tbody tr:not(:last-child)');
        if (!cartRows.length) {
            showAlert('Cart is empty', 'warning');
            return;
        }

        const cartData = Array.from(cartRows).map(row => {
            const itemId = row.getAttribute('data-item-id');
            if (!itemId) {
                throw new Error('Item ID not found in cart row');
            }

            const cells = row.cells;
            return {
                id: parseInt(itemId),
                name: cells[0].textContent.trim(),
                quantity: parseInt(cells[1].textContent),
                price: parseFloat(cells[2].textContent.replace('₹', ''))
            };
        });

        // Validate cart data
        if (!cartData.every(item => item.id && item.quantity && item.price)) {
            showAlert('Invalid cart data', 'danger');
            return;
        }

        // Show loading state
        const generateBillBtn = document.getElementById('generateBillBtn');
        const originalBtnText = generateBillBtn.innerHTML;
        generateBillBtn.disabled = true;
        generateBillBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Generating...';

        const formData = new FormData();
        formData.append('buyer_name', buyerName);
        formData.append('buyer_mobile', buyerMobile);
        formData.append('cart_data', JSON.stringify(cartData));

        fetch('/cashier/finalize', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to generate bill');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Update today's transactions first
                updateTodaysTransactions();
                
                // Clear the form
                document.getElementById('buyer_name').value = '';
                document.getElementById('buyer_mobile').value = '';
                updateCartView([]);
                
                // Show success message using flash message container
                const flashContainer = document.getElementById('flash-messages-container');
                if (!flashContainer) {
                    const container = document.createElement('div');
                    container.id = 'flash-messages-container';
                    document.body.appendChild(container);
                }
                
                const flashMessage = document.createElement('div');
                flashMessage.className = 'alert alert-success flash-message';
                flashMessage.innerHTML = '<i class="fas fa-check-circle me-2"></i>Bill generated successfully!';
                flashContainer.appendChild(flashMessage);
                
                // Add show class after a small delay to trigger animation
                setTimeout(() => {
                    flashMessage.classList.add('show');
                }, 100);
                
                // Remove message after 3 seconds
                setTimeout(() => {
                    flashMessage.classList.add('hide');
                    setTimeout(() => {
                        flashMessage.remove();
                        if (document.querySelectorAll('.flash-message').length === 0) {
                            flashContainer.remove();
                        }
                    }, 300);
                }, 3000);
                
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = '/cashier';
                }, 1000);
            } else {
                throw new Error(data.error || 'Failed to generate bill');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(error.message, 'danger');
        })
        .finally(() => {
            // Reset button state
            generateBillBtn.disabled = false;
            generateBillBtn.innerHTML = originalBtnText;
        });
    }

    // Add event listeners for resume transaction buttons
    document.querySelectorAll('.resume-transaction-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const transactionId = this.getAttribute('data-transaction-id');
            if (transactionId) {
                resumeTransaction(transactionId);
            }
        });
    });
    
    // Add event listener for the resume-transaction-btn class
    document.querySelectorAll('.resume-transaction').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const transactionId = this.getAttribute('data-transaction-id');
            if (transactionId) {
                resumeTransaction(transactionId);
            }
        });
    });
    
    // Add event listener for generate bill button
    if (generateBillBtn) {
        // Remove any existing event listeners
        const newGenerateBillBtn = generateBillBtn.cloneNode(true);
        generateBillBtn.parentNode.replaceChild(newGenerateBillBtn, generateBillBtn);
        
        newGenerateBillBtn.addEventListener('click', function(e) {
            e.preventDefault();
            generateBill();
        });
    }
    
    // Initial load of paused transactions
    refreshPausedTransactions();
    
    // Add event listener for confirm cancel button
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', function() {
            // Clear the cart
            if (cartManager && typeof cartManager.clearCart === 'function') {
                cartManager.clearCart();
            }
            
            // Clear buyer information
            if (buyerNameInput) buyerNameInput.value = '';
            if (buyerMobileInput) buyerMobileInput.value = '';
            
            // Hide the modal
            const cancelModal = bootstrap.Modal.getInstance(document.getElementById('cancelTransactionModal'));
            if (cancelModal) {
                cancelModal.hide();
            }
            
            // Show success message
            showSuccess('Transaction cancelled successfully!');
            
            // Redirect to cashier dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/cashier';
            }, 1000);
        });
    }

    // Function to update Today's Transactions section
    function updateTodaysTransactions() {
        fetch('/cashier/get_todays_transactions', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const transactionsTable = document.querySelector('.card:last-child .table-responsive tbody');
            const tableContainer = document.querySelector('.card:last-child .table-responsive');
            const noTransactionsAlert = document.querySelector('.card:last-child .alert-info');
            
            if (!transactionsTable) {
                console.error('Transactions table not found');
                return;
            }

            // Clear existing rows
            transactionsTable.innerHTML = '';

            if (data.transactions && data.transactions.length > 0) {
                // Add new transaction rows
                data.transactions.forEach(transaction => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${transaction.time}</td>
                        <td>${transaction.buyer_name}</td>
                        <td>${transaction.buyer_mobile}</td>
                        <td>₹${parseFloat(transaction.total_amount).toFixed(2)}</td>
                    `;
                    transactionsTable.appendChild(row);
                });

                // Show table and hide "no transactions" message
                if (tableContainer) tableContainer.style.display = 'block';
                if (noTransactionsAlert) noTransactionsAlert.style.display = 'none';
            } else {
                // Show "no transactions" message and hide table
                if (!noTransactionsAlert) {
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-info text-center';
                    alertDiv.innerHTML = '<i class="fas fa-info-circle me-2"></i>No transactions found for today.';
                    tableContainer.parentNode.insertBefore(alertDiv, tableContainer.nextSibling);
                } else {
                    noTransactionsAlert.style.display = 'block';
                }
                if (tableContainer) tableContainer.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error updating transactions:', error);
            showAlert('Failed to update transactions list: ' + error.message, 'danger');
        });
    }

    // Add event listeners for date filter
    document.addEventListener('DOMContentLoaded', function() {
        // Initial load of transactions
        updateTodaysTransactions();
    });
});