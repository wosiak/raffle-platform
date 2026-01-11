import React, { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

export default function ParticipantInput({ items, onChange, type = 'list' }) {
  const [inputText, setInputText] = useState('');
  const [singleItem, setSingleItem] = useState('');
  const [weight, setWeight] = useState(1);

  const handlePaste = () => {
    if (!inputText.trim()) return;
    
    const lines = inputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Deduplicação
    const existingValues = new Set(items.map(item => item.value));
    const newItems = lines
      .filter(line => !existingValues.has(line))
      .map(line => ({ value: line, weight: 1 }));
    
    onChange([...items, ...newItems]);
    setInputText('');
  };

  const handleAddSingle = () => {
    if (!singleItem.trim()) return;
    
    const exists = items.some(item => item.value === singleItem.trim());
    if (exists) {
      return;
    }
    
    onChange([...items, { 
      value: singleItem.trim(), 
      weight: type === 'weighted' ? weight : 1 
    }]);
    setSingleItem('');
    setWeight(1);
  };

  const handleRemove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setInputText(text);
      }
    };
    reader.readAsText(file);
  };

  const warnings = [];
  if (items.length === 0) {
    warnings.push('Adicione pelo menos um participante');
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Adicionar Participantes</h3>
        
        <div className="space-y-4">
          {/* Adicionar único */}
          <div className="flex gap-2">
            <Input
              placeholder="Nome do participante"
              value={singleItem}
              onChange={(e) => setSingleItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSingle()}
              className="flex-1 bg-white/50"
            />
            {type === 'weighted' && (
              <Input
                type="number"
                placeholder="Peso"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-24 bg-white/50"
                min="1"
              />
            )}
            <Button onClick={handleAddSingle} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Colar lista */}
          <div>
            <Textarea
              placeholder="Cole uma lista aqui (um item por linha)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px] bg-white/50"
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={handlePaste} variant="outline" className="flex-1">
                Adicionar Lista
              </Button>
              <label>
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Lista de participantes */}
      {items.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Participantes ({items.length})
            </h3>
            <Button 
              onClick={() => onChange([])} 
              variant="ghost" 
              size="sm"
              className="text-red-600"
            >
              Limpar Todos
            </Button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 bg-white/50 rounded-lg"
                >
                  <span className="text-sm text-gray-500 w-8">
                    #{index + 1}
                  </span>
                  <span className="flex-1 font-medium">
                    {item.value}
                  </span>
                  {type === 'weighted' && (
                    <span className="text-sm text-gray-600 bg-purple-100 px-2 py-1 rounded">
                      Peso: {item.weight}
                    </span>
                  )}
                  <Button
                    onClick={() => handleRemove(index)}
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      )}

      {/* Avisos */}
      {warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}