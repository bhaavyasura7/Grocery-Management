// Handle cart operations and transaction state management
class CartManager {
    constructor() {
        this.currentTransactionId = null;
        this.initialize();
    }

    // Method to completely clear the cart
    clearCart() {
        const cartContainer = document.querySelector('#activeTransactionView table tbody');
        if (cartContainer) {
            // Save the total row
            const totalRow = cartContainer.querySelector('tr:last-child');
            // Clear all items
            cartContainer.innerHTML = '';
            // Re-add the total row with reset total
            if (totalRow) {
                cartContainer.appendChild(totalRow);
                const totalCell = totalRow.querySelector('td:last-child');
                if (totalCell) {
                    totalCell.innerHTML = '<strong>₹0.00</strong>';
                }
            }
        }
    }

    initialize() {
        // Add event listener for the add item form
        const addItemForm = document.getElementById('addItemForm');
        if (addItemForm) {
            // Remove any existing event listeners
            const newForm = addItemForm.cloneNode(true);
            addItemForm.parentNode.replaceChild(newForm, addItemForm);
            newForm.addEventListener('submit', (e) => this.handleAddItem(e));
        }

        // Initialize cart view
        this.updateCartView();
        
        // Attach event listeners to remove buttons
        this.attachRemoveButtonListeners();
    }

    handleAddItem(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        // Enhanced client-side validation before sending
        const productId = formData.get('item_id');
        const quantity = formData.get('quantity');

        if (!productId || productId === '0') {
            this.showErrorMessage('Please select a product.');
            return;
        }

        if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
            this.showErrorMessage('Please enter a valid quantity (must be a positive number).');
            return;
        }

        // Get the current stock from the select option
        const productSelect = document.getElementById('item_id');
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const currentStock = parseInt(selectedOption.textContent.match(/Stock: (\d+)/)[1]);
        
        // Check if we have enough stock
        if (parseInt(quantity) > currentStock) {
            this.showErrorMessage(`Not enough stock available. Only ${currentStock} items in stock.`);
            return;
        }

        // Disable the form while processing
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        fetch('/cashier/add', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 500) {
                        throw new Error('Server error occurred. This might be due to invalid data or a server-side issue.');
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Update the entire cart section
                const activeTransactionView = document.getElementById('activeTransactionView');
                if (activeTransactionView) {
                    // Find the cart section within the active transaction view
                    const cartSection = activeTransactionView.querySelector('.cart-section');
                    if (cartSection) {
                        // Replace the entire cart section with the new HTML
                        cartSection.outerHTML = html;
                    } else {
                        // If there's no cart section yet (empty cart), insert the new HTML
                        // Find where to insert the cart section (after customer info fields)
                        const customerInfoFields = activeTransactionView.querySelector('.mb-4');
                        if (customerInfoFields) {
                            customerInfoFields.insertAdjacentHTML('afterend', html);
                        }
                    }
                    
                    // Re-attach event listeners to remove buttons
                    this.attachRemoveButtonListeners();
                }

                // Update the product stock in the select dropdown
                this.updateProductStock(productId, parseInt(quantity));

                // Reset quantity field
                document.getElementById('quantity').value = '';
                
                // Show success message
                this.showSuccessMessage('Item added to cart successfully!');

                // Update the Today's Transactions section
                this.updateTodaysTransactions();
            })
            .catch(error => {
                console.error('Error:', error);
                this.showErrorMessage('An error occurred while adding the item to cart.');
            })
            .finally(() => {
                // Re-enable the submit button
                submitButton.disabled = false;
            });
    }

    // Helper method to attach event listeners to remove buttons
    attachRemoveButtonListeners() {
        const cartContainer = document.querySelector('#activeTransactionView .cart-section');
        if (!cartContainer) return;
        
        const removeButtons = cartContainer.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(button => {
            // Remove any existing event listeners to prevent duplicates
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = newButton.getAttribute('data-item-id');
                const row = newButton.closest('tr');
                const quantity = parseInt(row.cells[1].textContent);

                // Disable the button while processing
                newButton.disabled = true;
                
                fetch(`/cashier/remove/${itemId}`, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.text())
                .then(html => {
                    // Update the entire cart section
                    const activeTransactionView = document.getElementById('activeTransactionView');
                    if (activeTransactionView) {
                        // Find the cart section within the active transaction view
                        const cartSection = activeTransactionView.querySelector('.cart-section');
                        if (cartSection) {
                            // Replace the entire cart section with the new HTML
                            cartSection.outerHTML = html;
                            
                            // Re-attach event listeners to remove buttons
                            this.attachRemoveButtonListeners();
                        }
                    }
                    
                    // Update the product stock in the select dropdown
                    this.updateProductStock(itemId, -quantity);
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.showErrorMessage('An error occurred while removing the item from cart.');
                    // Re-enable the button on error
                    newButton.disabled = false;
                });
            });
        });
    }

    updateCartView(doc = null) {
        const cartContainer = document.querySelector('#activeTransactionView table tbody');
        if (!cartContainer) return;

        if (doc) {
            const newCart = doc.querySelector('#activeTransactionView table tbody');
            if (newCart) {
                // Add subtle transition for cart updates
                cartContainer.style.opacity = '0';
                cartContainer.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    cartContainer.innerHTML = newCart.innerHTML;
                    cartContainer.style.opacity = '1';
                    cartContainer.style.transform = 'translateY(0)';
                    
                    // Re-attach event listeners to remove buttons
                    this.attachRemoveButtonListeners();
                }, 150);
            }
        }

        // Update the Today's Transactions section
        this.updateTodaysTransactions();
    }

    // Helper method to show error messages
    showErrorMessage(message) {
        // Create flash message container if it doesn't exist
        let flashContainer = document.getElementById('flash-messages-container');
        if (!flashContainer) {
            flashContainer = document.createElement('div');
            flashContainer.id = 'flash-messages-container';
            document.querySelector('.container').appendChild(flashContainer);
        }

        // Create and show new alert with subtle animation
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger flash-message';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${message}`;
        flashContainer.appendChild(alertDiv);
        
        // Add show class after a small delay to trigger animation
        setTimeout(() => {
            alertDiv.classList.add('show');
        }, 100);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            alertDiv.classList.add('hide');
            // Remove from DOM after animation completes
            setTimeout(() => {
                alertDiv.remove();
                
                // If this was the last message, remove the container
                if (document.querySelectorAll('.flash-message').length === 0) {
                    flashContainer.remove();
                }
            }, 300);
        }, 5000);
    }

    handleFlashMessages(doc) {
        const flashMessages = doc.querySelectorAll('.alert');
        if (flashMessages.length > 0) {
            const container = document.querySelector('.container');
            const existingAlerts = container.querySelectorAll('.alert');
            existingAlerts.forEach(alert => alert.remove());

            flashMessages.forEach(message => {
                container.insertBefore(message, container.firstChild);
                setTimeout(() => message.remove(), 5000);
            });
        }
    }

    // New method to update Today's Transactions section
    updateTodaysTransactions() {
        // First, get all transactions for today
        fetch('/cashier/get_todays_transactions', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
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
                if (transactionsTable && data.transactions && data.transactions.length > 0) {
                    // Clear existing rows
                    transactionsTable.innerHTML = '';

                    // Get the paused transaction IDs from the DOM
                    const pausedTransactionRows = document.querySelectorAll('#pausedTransactionView table tbody tr');
                    const pausedTransactionIds = new Set();

                    // Extract transaction IDs from the paused transactions view
                    pausedTransactionRows.forEach(row => {
                        const resumeBtn = row.querySelector('.resume-transaction-btn');
                        if (resumeBtn) {
                            const transactionId = resumeBtn.getAttribute('data-transaction-id');
                            if (transactionId) {
                                pausedTransactionIds.add(transactionId);
                            }
                        }
                    });

                    // Filter out transactions that are currently paused
                    // This assumes that paused transactions are not included in the bills table
                    // If they are, we'll need to check transaction status or compare with paused transactions
                    const activeTransactions = data.transactions;

                    // Add new transaction rows for active transactions only
                    activeTransactions.forEach(transaction => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                        <td>${transaction.time}</td>
                        <td>${transaction.buyer_name}</td>
                        <td>${transaction.buyer_mobile}</td>
                        <td>₹${transaction.total_amount}</td>
                    `;
                        transactionsTable.appendChild(row);
                    });

                    // Show the table and hide any 'no transactions' message
                    const tableContainer = document.querySelector('.card:last-child .table-responsive');
                    const noTransactionsAlert = document.querySelector('.card:last-child .alert-info');

                    if (activeTransactions.length > 0) {
                        if (tableContainer) tableContainer.style.display = 'block';
                        if (noTransactionsAlert) noTransactionsAlert.style.display = 'none';
                    } else {
                        // If no active transactions, show the 'no transactions' message
                        if (tableContainer) tableContainer.style.display = 'none';
                        if (noTransactionsAlert) noTransactionsAlert.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Error updating transactions:', error);
            });
    }

    // Helper method to show success messages
    showSuccessMessage(message) {
        // Create flash message container if it doesn't exist
        let flashContainer = document.getElementById('flash-messages-container');
        if (!flashContainer) {
            flashContainer = document.createElement('div');
            flashContainer.id = 'flash-messages-container';
            document.querySelector('.container').appendChild(flashContainer);
        }

        // Create and show new alert with subtle animation
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success flash-message';
        alertDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i>${message}`;
        flashContainer.appendChild(alertDiv);
        
        // Add show class after a small delay to trigger animation
        setTimeout(() => {
            alertDiv.classList.add('show');
        }, 100);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            alertDiv.classList.add('hide');
            // Remove from DOM after animation completes
            setTimeout(() => {
                alertDiv.remove();
                
                // If this was the last message, remove the container
                if (document.querySelectorAll('.flash-message').length === 0) {
                    flashContainer.remove();
                }
            }, 300);
        }, 5000);
    }

    // New method to update product stock in the select dropdown
    updateProductStock(productId, quantity) {
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
                    const newStock = currentStock - quantity;
                    
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
}

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const cartManager = new CartManager();

    // Add event listener for the Generate Bill button to update transactions
    const generateBillBtn = document.getElementById('generateBillBtn');
    if (generateBillBtn) {
        generateBillBtn.addEventListener('click', function() {
            // Validate customer info
            const buyerName = document.getElementById('buyer_name').value.trim();
            const buyerMobile = document.getElementById('buyer_mobile').value.trim();
            const cartItems = document.querySelectorAll('#activeTransactionView table tbody tr:not(:last-child)');

            if (!buyerName || !buyerMobile) {
                // Show validation error
                return;
            }

            if (!cartItems || cartItems.length === 0) {
                // Show empty cart error
                return;
            }

            // The form submission will happen via the modal
            // After successful submission, we'll update the transactions
            const confirmBillBtn = document.getElementById('confirmBillBtn');
            if (confirmBillBtn) {
                // Remove any existing event listeners to prevent duplicates
                const newConfirmBtn = confirmBillBtn.cloneNode(true);
                confirmBillBtn.parentNode.replaceChild(newConfirmBtn, confirmBillBtn);

                newConfirmBtn.addEventListener('click', function() {
                    // After a short delay to allow the server to process
                    setTimeout(() => {
                        cartManager.updateTodaysTransactions();
                    }, 500);
                });
            }
        });
    }

    // Add event listener for the Pause Transaction button to handle automatic redirection
    const pauseTransactionBtn = document.getElementById('pauseTransactionBtn');
    if (pauseTransactionBtn) {
        pauseTransactionBtn.addEventListener('click', function() {
            // The actual pause transaction logic is in transaction-management.js
            // We just need to ensure the cart is refreshed after redirection
            // The server will handle the redirect in the pauseTransaction function
            // This ensures a new transaction is started automatically after pausing

            // Disable the button to prevent multiple clicks
            this.disabled = true;
            setTimeout(() => {
                // Re-enable after 2 seconds in case the transaction fails
                this.disabled = false;
            }, 2000);
        });
    }

    // Ensure cart is properly initialized
    setTimeout(() => {
        cartManager.updateCartView();
    }, 100);
});

// Function to update cart section
function updateCartSection(cartHtml) {
    const cartSection = document.querySelector('.cart-section');
    if (cartSection) {
        cartSection.innerHTML = cartHtml;
        // Re-attach event listeners to remove buttons
        attachRemoveButtonListeners();
    }
}

// Function to attach event listeners to remove buttons
function attachRemoveButtonListeners() {
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.dataset.itemId;
            removeFromCart(itemId);
        });
    });
}

// Function to remove item from cart
function removeFromCart(itemId) {
    if (!confirm('Are you sure you want to remove this item from the cart?')) {
        return;
    }
    
    fetch('/remove_from_cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            item_id: itemId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update cart section with new HTML
            updateCartSection(data.cart_html);
            // Show success message
            alert('Item removed from cart successfully!');
        } else {
            alert(data.message || 'Error removing item from cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while removing item from cart');
    });
}

// Function to generate bill
function generateBill() {
    const buyerName = document.getElementById('buyer_name').value.trim();
    const buyerMobile = document.getElementById('buyer_mobile').value.trim();

    if (!buyerName || !buyerMobile) {
        alert('Please enter customer details');
        return;
    }

    const cartRows = document.querySelectorAll('#activeTransactionView table tbody tr:not(:last-child)');
    if (!cartRows.length) {
        alert('Cart is empty');
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
        alert('Invalid cart data');
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
            // Show success message
            alert('Bill generated successfully!');
            // Clear form
            document.getElementById('buyer_name').value = '';
            document.getElementById('buyer_mobile').value = '';
            // Clear cart
            updateCartSection('<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i> Your cart is empty. Add items to get started.</div>');
            // Redirect after a delay
            setTimeout(() => {
                window.location.href = '/cashier';
            }, 2000);
        } else {
            throw new Error(data.error || 'Failed to generate bill');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message);
    })
    .finally(() => {
        // Reset button state
        generateBillBtn.disabled = false;
        generateBillBtn.innerHTML = originalBtnText;
    });
}

// Attach event listeners when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Attach event listeners to remove buttons
    attachRemoveButtonListeners();
});
