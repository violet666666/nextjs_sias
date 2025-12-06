"use client";
import { useState } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

export default function GradeComponentManager({ components, onComponentsChange }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [newComponent, setNewComponent] = useState({ name: '', percentage: '' });

  const totalPercentage = components.reduce((sum, comp) => sum + parseFloat(comp.percentage || 0), 0);
  const remainingPercentage = 100 - totalPercentage;

  const handleAddComponent = () => {
    if (!newComponent.name || !newComponent.percentage) {
      return;
    }

    const percentage = parseFloat(newComponent.percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      return;
    }

    if (totalPercentage + percentage > 100) {
      return;
    }

    onComponentsChange([...components, { ...newComponent, percentage }]);
    setNewComponent({ name: '', percentage: '' });
  };

  const handleEditComponent = (index, updatedComponent) => {
    const updated = [...components];
    updated[index] = updatedComponent;
    onComponentsChange(updated);
    setEditingIndex(null);
  };

  const handleDeleteComponent = (index) => {
    onComponentsChange(components.filter((_, i) => i !== index));
  };

  const handleUpdatePercentage = (index, newPercentage) => {
    const percentage = parseFloat(newPercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      return;
    }

    const currentTotal = components.reduce((sum, comp, i) => 
      sum + (i === index ? 0 : parseFloat(comp.percentage || 0)), 0
    );

    if (currentTotal + percentage > 100) {
      return;
    }

    const updated = [...components];
    updated[index] = { ...updated[index], percentage };
    onComponentsChange(updated);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Komponen Nilai
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            totalPercentage === 100 ? 'text-green-600 dark:text-green-400' : 
            totalPercentage > 100 ? 'text-red-600 dark:text-red-400' : 
            'text-yellow-600 dark:text-yellow-400'
          }`}>
            Total: {totalPercentage.toFixed(1)}%
            {totalPercentage !== 100 && (
              <span className="ml-2 text-xs">
                ({remainingPercentage > 0 ? `Sisa: ${remainingPercentage.toFixed(1)}%` : `Kelebihan: ${Math.abs(remainingPercentage).toFixed(1)}%`})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* List of Components */}
      <div className="space-y-2 mb-4">
        {components.map((component, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {editingIndex === index ? (
              <>
                <input
                  type="text"
                  value={component.name}
                  onChange={(e) => {
                    const updated = [...components];
                    updated[index] = { ...updated[index], name: e.target.value };
                    onComponentsChange(updated);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Nama komponen"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={component.percentage}
                  onChange={(e) => handleUpdatePercentage(index, e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="%"
                />
                <button
                  onClick={() => setEditingIndex(null)}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <Save className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {component.name}
                  </span>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    ({component.percentage}%)
                  </span>
                </div>
                <button
                  onClick={() => setEditingIndex(index)}
                  className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteComponent(index)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add New Component */}
      {totalPercentage < 100 && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <input
            type="text"
            value={newComponent.name}
            onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="Nama komponen (contoh: Tugas, UTS, UAS)"
          />
          <input
            type="number"
            min="0"
            max={remainingPercentage}
            step="0.1"
            value={newComponent.percentage}
            onChange={(e) => setNewComponent({ ...newComponent, percentage: e.target.value })}
            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="%"
          />
          <button
            onClick={handleAddComponent}
            disabled={!newComponent.name || !newComponent.percentage || totalPercentage + parseFloat(newComponent.percentage || 0) > 100}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tambah Komponen"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {totalPercentage !== 100 && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          totalPercentage > 100 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
        }`}>
          {totalPercentage > 100 
            ? `Total persentase melebihi 100%. Kurangi ${Math.abs(remainingPercentage).toFixed(1)}%`
            : `Total persentase harus 100%. Tambahkan ${remainingPercentage.toFixed(1)}% lagi`
          }
        </div>
      )}
    </div>
  );
}

