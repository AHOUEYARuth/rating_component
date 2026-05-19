<template>
  <div class="dashboard-container">
    <header class="glass-header">
      <div class="logo">
        <h1>Wexgo <span>Flow</span> Test</h1>
      </div>
      <div class="tabs">
        <button v-for="tab in tabs" :key="tab.id" 
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>
    </header>

    <main class="content">
      <!-- ONGLET RÉFÉRENCES -->
      <section v-if="activeTab === 'config'" class="tab-content glass-card">
        <h2>Données de Référence</h2>
        <div class="form-group grid">
          <div class="input-wrap">
            <label>Latitude de ramassage</label>
            <input v-model.number="config.lat" type="number" step="0.0001" />
          </div>
          <div class="input-wrap">
            <label>Longitude de ramassage</label>
            <input v-model.number="config.lng" type="number" step="0.0001" />
          </div>
          <div class="input-wrap">
            <label>Type de livraison</label>
            <select v-model="config.type">
              <option value="express">Express</option>
              <option value="freight">Fret</option>
            </select>
          </div>
        </div>
        <div class="actions">
          <button @click="fetchReference" :disabled="loading" class="primary-btn">
            {{ loading ? 'Chargement...' : 'Récupérer les Références' }}
          </button>
        </div>

        <div v-if="referenceData" class="results-grid mt-2">
          <div class="result-card">
            <h3>Types de Véhicules</h3>
            <div class="badge-list">
              <div v-for="v in referenceData.vehicles" :key="v.code" class="v-card">
                <img v-if="v.pictogram" :src="v.pictogram" class="v-icon" />
                <span>{{ v.name }} <code>({{ v.code }})</code></span>
              </div>
              <div v-if="referenceData.anyVehicle" class="v-card highlight">
                <img v-if="referenceData.anyVehicle.pictogram" :src="referenceData.anyVehicle.pictogram" class="v-icon" />
                <span>{{ referenceData.anyVehicle.label }} <code>({{ referenceData.anyVehicle.code || 'any' }})</code></span>
              </div>
            </div>
          </div>
          <div class="result-card">
            <h3>Catégories de Colis</h3>
            <div class="badge-list">
              <div v-for="cat in referenceData.packageCategories" :key="cat.code" class="badge">
                <strong>{{ cat.label }}</strong> 
                <span class="weight-info">({{ cat.minKg }} - {{ cat.maxKg }}kg)</span>
                <code>{{ cat.code }}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ONGLET DEVIS ET COMMANDE -->
      <section v-if="activeTab === 'order'" class="tab-content glass-card">
        <h2>Créer un Devis / Livraison</h2>
        
        <div class="form-section">
          <h3>📦 Informations de Ramassage</h3>
          <div class="form-group grid">
            <div class="input-wrap"><label>Adresse complète</label><input v-model="deliveryForm.pickupAddress" /></div>
            <div class="input-wrap"><label>Latitude</label><input v-model.number="deliveryForm.pickupLatitude" type="number" /></div>
            <div class="input-wrap"><label>Longitude</label><input v-model.number="deliveryForm.pickupLongitude" type="number" /></div>
            <div class="input-wrap"><label>Nom du contact</label><input v-model="deliveryForm.pickupContactName" /></div>
            <div class="input-wrap"><label>Téléphone</label><input v-model="deliveryForm.pickupContactPhone" /></div>
          </div>
        </div>

        <div class="form-section">
          <h3>🚗 Options de Transport</h3>
          <div class="form-group grid">
            <div class="input-wrap">
              <label>Choix du Véhicule</label>
              <select v-model="deliveryForm.vehicleTypeCode">
                <option value="">N'importe quel véhicule</option>
                <option v-for="v in referenceData?.vehicles" :key="v.code" :value="v.code">{{ v.name }}</option>
                <option v-if="referenceData?.anyVehicle" :value="referenceData.anyVehicle.code">{{ referenceData.anyVehicle.label }}</option>
              </select>
            </div>
            <div class="input-wrap checkbox-wrap">
              <label><input type="checkbox" v-model="deliveryForm.helpLoadingAtPickup" /> Aide au chargement (Ramassage)</label>
              <label><input type="checkbox" v-model="deliveryForm.helpUnloadingAtDropoff" /> Aide au déchargement (Livraison)</label>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>📍 Destinations</h3>
          <div class="form-group glass-inner-card" v-for="(dest, index) in deliveryForm.destinations" :key="index">
            <div class="grid">
              <div class="input-wrap"><label>Adresse de livraison</label><input v-model="dest.dropoffAddress" /></div>
              <div class="input-wrap"><label>Latitude</label><input v-model.number="dest.dropoffLatitude" type="number" /></div>
              <div class="input-wrap"><label>Longitude</label><input v-model.number="dest.dropoffLongitude" type="number" /></div>
              <div class="input-wrap"><label>Nom du destinataire</label><input v-model="dest.recipientName" /></div>
              <div class="input-wrap"><label>Téléphone</label><input v-model="dest.recipientPhone" /></div>
              <div class="input-wrap">
                <label>Catégorie</label>
                <select v-model="dest.packageCategory">
                  <option value="">Par défaut</option>
                  <option v-for="cat in referenceData?.packageCategories" :key="cat.code" :value="cat.code">
                    {{ cat.label }} ({{ cat.minKg }}-{{ cat.maxKg }}kg)
                  </option>
                </select>
              </div>
            </div>
            <div class="input-wrap mt-1">
              <label>Images (URLs séparées par des virgules)</label>
              <textarea v-model="destinationImages[index]" placeholder="https://..."></textarea>
            </div>
          </div>
        </div>

        <div class="actions">
          <button @click="getQuote" :disabled="loading" class="secondary-btn">Calculer le Devis</button>
          <button @click="createDelivery" :disabled="loading" class="primary-btn">Créer la Livraison</button>
        </div>

        <!-- AFFICHAGE DES RÉSULTATS FORMATÉS -->
        <div v-if="lastResponse" class="response-display" :class="{ error: lastResponse.isError }">
          <div v-if="lastResponse.isError" class="error-msg">
            <strong>⚠️ Erreur :</strong> {{ lastResponse.data }}
          </div>
          <div v-else class="success-data">
            <div v-if="lastResponse.type === 'quote'" class="quote-summary">
              <h4>Estimation reçue :</h4>
              <div class="data-item"><strong>Prix :</strong> {{ lastResponse.data.price.amount }} {{ lastResponse.data.price.currency }}</div>
              <div class="data-item"><strong>Distance estimée :</strong> {{ lastResponse.data.estimatedDistanceKm }} km</div>
            </div>
            <div v-if="lastResponse.type === 'delivery'" class="delivery-summary">
              <h4>Livraison créée avec succès !</h4>
              <div class="data-item"><strong>N° de livraison :</strong> <code class="highlight-code">{{ lastResponse.data.delivery.deliveryNumber }}</code></div>
              <div class="data-item"><strong>Statut initial :</strong> {{ formatStatus(lastResponse.data.delivery.status) }}</div>
              <p class="hint">Copiez ce numéro pour le tester dans l'onglet Suivi.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ONGLET SUIVI -->
      <section v-if="activeTab === 'track'" class="tab-content glass-card">
        <h2>Suivi de Livraison</h2>
        <div class="form-group row">
          <input v-model="trackNumber" placeholder="Numéro de livraison (ex: DAAS-...)" />
          <button @click="trackDelivery" :disabled="loading" class="primary-btn">Suivre</button>
        </div>

        <div v-if="trackingInfo" class="tracking-result">
          <div class="status-header">
            <span class="status-badge" :data-status="trackingInfo.status">{{ formatStatus(trackingInfo.status) }}</span>
            <span class="number">{{ trackingInfo.deliveryNumber }}</span>
          </div>
          <div class="info-grid mt-1">
            <div class="info-item">
              <strong>Prix :</strong> {{ trackingInfo.pricing.total.amount }} {{ trackingInfo.pricing.total.currency }}
            </div>
            <div class="info-item">
              <strong>Distance :</strong> {{ trackingInfo.metrics?.totalDistanceKm }} km
            </div>
            <div v-if="trackingInfo.driver" class="info-item driver-card full-width">
              <img :src="trackingInfo.driver.photoUrl" class="driver-photo" />
              <div class="driver-details">
                <strong>{{ trackingInfo.driver.name }}</strong>
                <span class="driver-sub">{{ trackingInfo.driver.phone }} • ⭐ {{ trackingInfo.driver.rating }}</span>
                <span class="vehicle-tag">{{ trackingInfo.driver.vehicleInfo }} ({{ trackingInfo.driver.vehiclePlateNumber }})</span>
              </div>
            </div>
            <div class="info-item full-width">
                <strong>Trajet :</strong>
                <div class="journey">
                    <div class="point">🔵 <strong>Départ :</strong> {{ trackingInfo.pickup.address }}</div>
                    <div v-for="(dest, i) in trackingInfo.destinations" :key="i" class="point">
                        📍 <strong>Destination {{ Number(i) + 1 }} :</strong> {{ dest.dropoff.address }} 
                        <span class="seq">({{ dest.status }})</span>
                    </div>
                </div>
            </div>
            <div class="info-item full-width">
                <strong>Historique :</strong>
                <ul class="history-list">
                    <li v-for="(date, key) in trackingInfo.dates" :key="key">
                        <span v-if="date"><strong>{{ formatKey(key as string) }} :</strong> {{ new Date(date as any).toLocaleString('fr-FR') }}</span>
                    </li>
                </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- ONGLET SANDBOX -->
      <section v-if="activeTab === 'sandbox'" class="tab-content glass-card">
        <h2>Simulateur Sandbox</h2>
        <p class="helper-text">Simulez les changements de statut pour tester vos webhooks ou le flux de suivi (utilisez l'ID interne).</p>
        <div class="form-group grid">
          <div class="input-wrap">
            <label>ID Interne de livraison</label>
            <input v-model="sandbox.id" placeholder="ID (ex: 123...)" />
          </div>
          <div class="input-wrap">
            <label>Nouveau statut</label>
            <select v-model="sandbox.status">
              <option value="accepted">Accepté</option>
              <option value="pickup_reached">Arrivé au ramassage</option>
              <option value="in_transit">En transit</option>
              <option value="delivered">Livré</option>
              <option value="cancelled">Annulé</option>
              <option value="failed">Échoué</option>
            </select>
          </div>
        </div>
        <div class="actions">
          <button @click="simulateStatus" :disabled="loading" class="primary-btn">Mettre à jour le Statut</button>
        </div>
      </section>
    </main>

    <div v-if="toast" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { wexgoService } from '../services/wexgoService';

const tabs = [
  { id: 'config', label: 'Références' },
  { id: 'order', label: 'Devis & Commande' },
  { id: 'track', label: 'Suivi' },
  { id: 'sandbox', label: 'Sandbox' }
];

const activeTab = ref('config');
const loading = ref(false);
const toast = ref<{ message: string, type: 'success' | 'error' } | null>(null);

// Formulaire States
const config = reactive({
  lat: 6.3902154,
  lng: 2.3881624,
  type: 'express'
});

const deliveryForm = reactive({
  pickupAddress: "Cocody, Abidjan, Côte-d'Ivoire",
  pickupLatitude: 6.3902154,
  pickupLongitude: 2.3881624,
  pickupContactName: "John Doe",
  pickupContactPhone: "+2250700000000",
  deliveryType: 'express' as const,
  vehicleTypeCode: '',
  helpLoadingAtPickup: false,
  helpUnloadingAtDropoff: false,
  destinations: [
    {
      dropoffAddress: "Marcory, Abidjan, Côte-d'Ivoire",
      dropoffLatitude: 6.3902154,
      dropoffLongitude: 2.3881624,
      recipientName: "Jane Smith",
      recipientPhone: "+2250500000000",
      packageDescription: "Test Colis",
      packageCategory: "small",
      images: [] as string[]
    }
  ]
});

const destinationImages = ref<string[]>(['']);

const trackNumber = ref('');
const sandbox = reactive({
  id: '',
  status: 'accepted'
});

// Résultats des données
const referenceData = ref<any>(null);
const lastResponse = ref<{ isError: boolean, data: any, type: string } | null>(null);
const trackingInfo = ref<any>(null);

// Méthodes
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { message, type };
  setTimeout(() => toast.value = null, 3000);
};

const formatStatus = (s: string) => {
    const map: any = {
        'pending': 'En attente',
        'accepted': 'Accepté',
        'pickup_reached': 'Point de retrait atteint',
        'in_transit': 'En cours de livraison',
        'delivered': 'Livré',
        'cancelled': 'Annulé',
        'failed': 'Échoué'
    };
    return map[s] || s;
};

const formatKey = (k: string) => {
    const map: any = {
        'createdAt': 'Créé le',
        'updatedAt': 'Mis à jour le',
        'pickupAt': 'Récupéré le',
        'deliveredAt': 'Livré le'
    };
    return map[k] || k;
};

const fetchReference = async () => {
  loading.value = true;
  try {
    const [vehicles, categories] = await Promise.all([
      wexgoService.getVehicleTypes(config.lat, config.lng, config.type),
      wexgoService.getPackageCategories(config.lat, config.lng, config.type)
    ]);
    referenceData.value = { ...vehicles, ...categories };
    console.log("referenceData",referenceData.value);
    showToast('Données de référence chargées');
  } catch (e: any) {
    showToast(e.message, 'error');
    console.log("error",e);
  } finally {
    loading.value = false;
  }
};

const getQuote = async () => {
  loading.value = true;
  try {
    // Inject image arrays from local ref
    deliveryForm.destinations.forEach((dest, i) => {
      dest.images = destinationImages.value[i]?.split(',').map(s => s.trim()).filter(s => s);
    });
    
    const res = await wexgoService.getQuote(deliveryForm);
    lastResponse.value = { isError: false, data: res, type: 'quote' };
    console.log("Deviseeee",res);
    showToast('Devis reçu');
  } catch (e: any) {
    lastResponse.value = { isError: true, data: e.message, type: 'error' };
    showToast(e.message, 'error');
  } finally {
    loading.value = false;
  }
};

const createDelivery = async () => {
  loading.value = true;
  try {
    deliveryForm.destinations.forEach((dest, i) => {
      dest.images = destinationImages.value[i]?.split(',').map(s => s.trim()).filter(s => s);
    });
    
    const res = await wexgoService.createDelivery(deliveryForm);
    lastResponse.value = { isError: false, data: res, type: 'delivery' };
    trackNumber.value = res.deliveryNumber;
    console.log("lastResponse",lastResponse.value);
    showToast('Livraison créée !');
  } catch (e: any) {
    lastResponse.value = { isError: true, data: e.message, type: 'error' };
    showToast(e.message, 'error');
  } finally {
    loading.value = false;
  }
};

const trackDelivery = async () => {
  if (!trackNumber.value) return;
  loading.value = true;
  try {
    trackingInfo.value = await wexgoService.trackDelivery(trackNumber.value);
    console.log("trackingInfo",trackingInfo.value);
    showToast('Suivi mis à jour');
  } catch (e: any) {
    showToast(e.message, 'error');
  } finally {
    loading.value = false;
  }
};

const simulateStatus = async () => {
  if (!sandbox.id) return;
  loading.value = true;
  try {
    await wexgoService.simulateStatus(sandbox.id, sandbox.status);
    showToast('Statut mis à jour (Sandbox)');
  } catch (e: any) {
    showToast(e.message, 'error');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');

.dashboard-container {
  min-height: 100vh;
  background: radial-gradient(circle at top right, #1a1a2e, #16213e);
  color: #fff;
  font-family: 'Outfit', sans-serif;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.glass-header {
  width: 100%;
  max-width: 1000px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.logo span {
  color: #4ecca3;
}

.tabs {
  display: flex;
  gap: 1rem;
}

.tabs button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  border-radius: 10px;
}

.tabs button.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.content {
  width: 100%;
  max-width: 1000px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

h2 {
  font-size: 1.8rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  background: linear-gradient(to right, #fff, #999);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

h3 {
  font-size: 1.1rem;
  color: #4ecca3;
  margin-bottom: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.input-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.85rem;
  opacity: 0.7;
}

input, select {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.8rem 1rem;
  color: #fff;
  outline: none;
  transition: border-color 0.3s;
}

input:focus, select:focus {
  border-color: #4ecca3;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.primary-btn {
  background: linear-gradient(135deg, #4ecca3, #45b08c);
  color: #1a1a2e;
  border: none;
  padding: 1rem 2rem;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(78, 204, 163, 0.4);
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.6rem 1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.weight-info {
  font-size: 0.75rem;
  opacity: 0.7;
}

.mt-1 { margin-top: 1rem; }
.mt-2 { margin-top: 2rem; }

.v-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.6rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.v-card.highlight {
  border-color: #4ecca3;
  background: rgba(78, 204, 163, 0.05);
}

.v-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.response-display {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: fadeIn 0.3s ease-out;
}

.response-display.error {
  border-color: #ff4d4d;
  background: rgba(255, 77, 77, 0.05);
}

.error-msg {
  color: #ff4d4d;
}

.success-data h4 {
  margin-top: 0;
  color: #4ecca3;
  margin-bottom: 1rem;
}

.data-item {
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.highlight-code {
  background: rgba(78, 204, 163, 0.2);
  color: #4ecca3;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: 700;
}

.hint {
  font-size: 0.85rem;
  opacity: 0.6;
  margin-top: 1rem;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.history-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.full-width {
  grid-column: 1 / -1;
}

.tracking-result {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-badge {
    padding: 0.5rem 1rem;
    border-radius: 30px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.75rem;
    background: #555;
}

.status-badge[data-status="pending"] { background: #f39c12; }
.status-badge[data-status="accepted"] { background: #3498db; }
.status-badge[data-status="in_transit"] { background: #9b59b6; }
.status-badge[data-status="delivered"] { background: #2ecc71; }

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.toast.success { background: rgba(78, 204, 163, 0.9); color: #1a1a2e; }
.toast.error { background: rgba(255, 77, 77, 0.9); color: #fff; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.driver-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: rgba(78, 204, 163, 0.1);
  padding: 1.2rem;
  border-radius: 16px;
  border: 1px solid rgba(78, 204, 163, 0.2);
}

.driver-photo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4ecca3;
}

.driver-details {
  display: flex;
  flex-direction: column;
}

.driver-sub {
  font-size: 0.85rem;
  opacity: 0.7;
}

.vehicle-tag {
  font-size: 0.85rem;
  color: #4ecca3;
  font-weight: 600;
  margin-top: 0.2rem;
}

.journey {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.point {
  font-size: 0.9rem;
  padding-left: 1rem;
  border-left: 2px dashed rgba(255, 255, 255, 0.2);
  position: relative;
}

.point::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 8px;
  width: 8px;
  height: 8px;
  background: #4ecca3;
  border-radius: 50%;
}

.point .seq {
  font-size: 0.75rem;
  opacity: 0.6;
  text-transform: uppercase;
  margin-left: 0.5rem;
}

.checkbox-wrap {
  flex-direction: row !important;
  align-items: center;
  gap: 2rem;
  padding-top: 1.5rem;
}

.checkbox-wrap label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.glass-inner-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 1.5rem;
}

textarea {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.8rem 1rem;
  color: #fff;
  outline: none;
  min-height: 80px;
  width: 100%;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10%); }
  to { opacity: 1; transform: translateY(0); }
}
</style>