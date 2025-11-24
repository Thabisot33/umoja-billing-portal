import React, { useEffect, useState, useMemo } from 'react';
import { Admin, Customer, Billing, InventoryItem, ProductFilter, CityFilter } from '../types';
import { AUTH_HEADER, ENDPOINTS } from '../constants';
import { Search, LogOut, User, Filter, RefreshCcw } from 'lucide-react';
import { CustomerModal } from './CustomerModal';
import { AdminModal } from './AdminModal';

interface DashboardProps {
  admin: Admin;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ admin, onLogout }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<CityFilter>(CityFilter.ALL);
  const [productFilter, setProductFilter] = useState<ProductFilter>(ProductFilter.ALL);
  
  const [selectedCustomer, setSelectedCustomer] = useState<{ customer: Customer; billing?: Billing } | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { "Authorization": AUTH_HEADER };
      const [custRes, billRes, invRes] = await Promise.all([
        fetch(ENDPOINTS.CUSTOMERS, { headers }),
        fetch(ENDPOINTS.BILLING, { headers }),
        fetch(ENDPOINTS.INVENTORY, { headers })
      ]);

      if (!custRes.ok || !billRes.ok || !invRes.ok) throw new Error("Failed to fetch API data");

      const cData = await custRes.json();
      const bData = await billRes.json();
      const iData = await invRes.json();

      setCustomers(cData);
      setBillings(bData);
      setInventory(iData);
    } catch (err: any) {
      setError(err.message || "Unknown error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    // 1. Inventory Logic
    let relevantInventory = inventory.filter(item => 
      (item.product_id === 1 || item.product_id === 2) && 
      item.status?.toLowerCase() === "assigned"
    );

    if (productFilter !== ProductFilter.ALL) {
      const pid = parseInt(productFilter);
      relevantInventory = relevantInventory.filter(i => i.product_id === pid);
    }

    const validCustomerIds = new Set(relevantInventory.map(i => i.customer_id));

    // 2. Customer Logic
    let result = customers.filter(c => 
      (c.status?.toLowerCase() === "blocked" || c.status?.toLowerCase() === "disabled") &&
      validCustomerIds.has(c.id)
    );

    // 3. City Filter
    if (cityFilter !== CityFilter.ALL) {
      result = result.filter(c => 
        c.city && c.city.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // 4. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }

    return result;
  }, [customers, inventory, productFilter, cityFilter, searchQuery]);

  // Counts for buttons
  const getCount = (filter: ProductFilter) => {
    // Simplified count logic reusing logic above, slightly redundant but safer for accurate UI
    // For performance in large datasets, we would optimize this.
    // For now, let's just use the current filtered list length if the button matches the current filter
    if (filter === productFilter) return filteredData.length;
    return '?'; // Or implement full separate calculation if needed
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-30 bg-[#f6f8fa]/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
          
          {/* Top Bar: Title & User */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Blocked Customers</h1>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                Welcome, 
                <button 
                  onClick={() => setShowAdminModal(true)} 
                  className="font-semibold text-brand-500 hover:underline flex items-center gap-1"
                >
                  <User size={14} /> {admin.name}
                </button>
              </p>
            </div>
            <button 
              onClick={onLogout}
              className="self-start md:self-center px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>

          {/* Controls Area */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input 
                type="text" 
                placeholder="Search customers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
              />
            </div>

            {/* City Filter */}
            <div className="relative min-w-[150px]">
               <select 
                value={cityFilter} 
                onChange={(e) => setCityFilter(e.target.value as CityFilter)}
                className="w-full py-2.5 px-4 pr-8 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none appearance-none bg-white cursor-pointer"
              >
                <option value={CityFilter.ALL}>All Cities</option>
                <option value={CityFilter.POLOKWANE}>Polokwane</option>
                <option value={CityFilter.JOHANNESBURG}>Johannesburg</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          {/* Product Filters Pills */}
          <div className="flex justify-center md:justify-start gap-2 overflow-x-auto pb-1">
            {[
              { label: 'ALL', value: ProductFilter.ALL },
              { label: 'G5010', value: ProductFilter.G5010 },
              { label: 'Baicell', value: ProductFilter.BAICELL }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setProductFilter(f.value)}
                className={`
                  px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                  ${productFilter === f.value 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-200 scale-105' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                {f.label} {productFilter === f.value && `(${filteredData.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-4xl mx-auto w-full px-4 py-6 flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <RefreshCcw className="animate-spin h-8 w-8 mb-2 text-brand-500" />
             <p>Loading Data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center">
            {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No customers found matching filters.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredData.map(cust => {
              const billing = billings.find(b => b.customer_id === cust.id);
              const deposit = billing ? billing.deposit : "N/A";
              return (
                <li 
                  key={cust.id}
                  onClick={() => setSelectedCustomer({ customer: cust, billing })}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 hover:bg-brand-50/30 transition-all cursor-pointer flex justify-between items-center group"
                >
                  <div>
                    <span className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
                      {cust.name || "Unknown Customer"}
                    </span>
                    <div className="text-xs text-slate-400 mt-1">ID: {cust.id} • {cust.city || 'No City'}</div>
                  </div>
                  <div className="font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-md text-sm font-medium">
                    {deposit}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modals */}
      {selectedCustomer && (
        <CustomerModal 
          customer={selectedCustomer.customer}
          billing={selectedCustomer.billing}
          admin={admin}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {showAdminModal && (
        <AdminModal 
          admin={admin} 
          onClose={() => setShowAdminModal(false)} 
        />
      )}

    </div>
  );
};