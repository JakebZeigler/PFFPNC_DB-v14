const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(firstName: string, lastName: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
  }

  // Customer endpoints
  async getCustomers() {
    return this.request('/customers');
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`);
  }

  async saveCustomer(customer: any) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async deleteCustomer(id: string) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkAddCustomers(customers: any[]) {
    return this.request('/customers/bulk', {
      method: 'POST',
      body: JSON.stringify(customers),
    });
  }

  async deleteAllCustomers(verification: string) {
    return this.request('/customers', {
      method: 'DELETE',
      body: JSON.stringify({ verification }),
    });
  }

  // Agent endpoints
  async getAgents() {
    return this.request('/agents');
  }

  async saveAgent(agent: any) {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: string) {
    return this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Disposition endpoints
  async getDispositions() {
    return this.request('/dispositions');
  }

  async saveDisposition(disposition: any) {
    return this.request('/dispositions', {
      method: 'POST',
      body: JSON.stringify(disposition),
    });
  }

  async deleteDisposition(id: string) {
    return this.request(`/dispositions/${id}`, {
      method: 'DELETE',
    });
  }

  // Show endpoints
  async getShows() {
    return this.request('/shows');
  }

  async saveShow(show: any) {
    return this.request('/shows', {
      method: 'POST',
      body: JSON.stringify(show),
    });
  }

  async deleteShow(id: string) {
    return this.request(`/shows/${id}`, {
      method: 'DELETE',
    });
  }

  // Association endpoints
  async getAssociations() {
    return this.request('/associations');
  }

  async saveAssociation(association: any) {
    return this.request('/associations', {
      method: 'POST',
      body: JSON.stringify(association),
    });
  }

  async deleteAssociation(id: string) {
    return this.request(`/associations/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUsers() {
    return this.request('/users');
  }

  async updateUser(id: string, user: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
