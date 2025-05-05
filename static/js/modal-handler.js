// Modal Handler for Grocery Management System

document.addEventListener('DOMContentLoaded', function () {
    // Get all modals on the page
    const modals = document.querySelectorAll('.modal');

    // Function to show feedback message
    function showFeedback(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.container').firstChild);
    }

    // Initialize each modal
    modals.forEach(modal => {
        const modalInstance = new bootstrap.Modal(modal);
        const form = modal.querySelector('form');

        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                const submitButton = form.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.innerHTML;

                try {
                    // Disable submit button and show loading state
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Processing...';

                    const formData = new FormData(form);
                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        modalInstance.hide();
                        showFeedback('Operation completed successfully!');
                        // Use setTimeout to allow user to see the success message
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        const errorData = await response.text();
                        throw new Error(errorData || 'Form submission failed');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showFeedback(error.message, 'danger');
                } finally {
                    // Reset button state
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                }
            });
        }

        // Clean up modal content when it's closed
        modal.addEventListener('hidden.bs.modal', function () {
            if (form) {
                form.reset();
                // Remove any existing feedback messages
                const alerts = document.querySelectorAll('.alert');
                alerts.forEach(alert => alert.remove());
            }
        });
    });
});