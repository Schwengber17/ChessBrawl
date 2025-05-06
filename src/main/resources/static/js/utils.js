// utils.js - Funções utilitárias para o frontend

// Obter parâmetros da URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    }
    
    return params;
}

// Mostrar notificação
function showNotification(message, type = 'success', duration = 3000) {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getIconForType(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Adicionar evento para fechar
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-fechar após duração
    setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
    
    // Função auxiliar para ícones
    function getIconForType(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-info-circle';
        }
    }
}

// Validação de formulário
function validateForm(formElement, validationRules) {
    const formData = new FormData(formElement);
    const errors = {};
    
    // Verificar cada campo
    for (const [field, rules] of Object.entries(validationRules)) {
        const value = formData.get(field);
        
        // Verificar regras
        for (const rule of rules) {
            if (rule.type === 'required' && !value) {
                errors[field] = rule.message || 'Este campo é obrigatório';
                break;
            }
            
            if (rule.type === 'minLength' && value.length < rule.value) {
                errors[field] = rule.message || `Mínimo de ${rule.value} caracteres`;
                break;
            }
            
            if (rule.type === 'maxLength' && value.length > rule.value) {
                errors[field] = rule.message || `Máximo de ${rule.value} caracteres`;
                break;
            }
            
            if (rule.type === 'pattern' && !rule.pattern.test(value)) {
                errors[field] = rule.message || 'Formato inválido';
                break;
            }
            
            if (rule.type === 'custom' && !rule.validate(value, formData)) {
                errors[field] = rule.message || 'Valor inválido';
                break;
            }
        }
    }
    
    // Mostrar erros no formulário
    for (const field of Object.keys(validationRules)) {
        const inputElement = formElement.querySelector(`[name="${field}"]`);
        const errorElement = formElement.querySelector(`#${field}-error`);
    
        if (errors[field]) {
            if (inputElement) {
                inputElement.classList.add('is-invalid');
            }
            if (errorElement) {
                errorElement.textContent = errors[field];
                errorElement.style.display = 'block';
            }
        } else {
            if (inputElement) {
                inputElement.classList.remove('is-invalid');
            }
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}