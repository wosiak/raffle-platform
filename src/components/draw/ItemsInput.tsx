import React, { useState, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { 
  Upload, 
  Trash2, 
  Plus, 
  Copy, 
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Scale
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ItemsInput({ 
  items = [], 
  onChange, 
  useWeights = false,
  maxItems = 10000 
}) {
  const [inputMode, setInputMode] = useState('paste'); // paste, upload, manual
  const [textInput, setTextInput] = useState('');
  const [manualItem, setManualItem] = useState('');
  const [manualWeight, setManualWeight] = useState(1);
  const [errors, setErrors] = useState([]);

  const parseAndAddItems = useCallback((text) => {
    const lines = text.split(/[\n,;]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const newItems = lines.map(value => ({
      value,
      weight: 1,
      metadata: {}
    }));

    // Deduplication
    const seen = new Set();
    const deduped = [];
    const duplicates = [];

    for (const item of [...items, ...newItems]) {
      if (seen.has(item.value.toLowerCase())) {
        duplicates.push(item.value);
      } else {
        seen.add(item.value.toLowerCase());
        deduped.push(item);
      }
    }

    if (duplicates.length > 0) {
      setErrors([`${duplicates.length} item(s) duplicado(s) removido(s)`]);
      setTimeout(() => setErrors([]), 3000);
    }

    if (deduped.length > maxItems) {
      setErrors([`Limite de ${maxItems} itens atingido`]);
      onChange(deduped.slice(0, maxItems));
    } else {
      onChange(deduped);
    }
    
    setTextInput('');
  }, [items, onChange, maxItems]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        parseAndAddItems(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [parseAndAddItems]);

  const addManualItem = () => {
    if (!manualItem.trim()) return;
    
    const newItem = {
      value: manualItem.trim(),
      weight: useWeights ? manualWeight : 1,
      metadata: {}
    };

    const exists = items.some(i => i.value.toLowerCase() === newItem.value.toLowerCase());
    if (exists) {
      setErrors(['Este item já existe na lista']);
      setTimeout(() => setErrors([]), 3000);
      return;
    }

    onChange([...items, newItem]);
    setManualItem('');
    setManualWeight(1);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItemWeight = (index, weight) => {
    const updated = [...items];
    updated[index] = { ...updated[index], weight: Math.max(1, weight) };
    onChange(updated);
  };

  const clearAll = () => {
    onChange([]);
    setTextInput('');
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-500" />
          Itens do Sorteio
        </h3>
        <Badge variant="outline" className="text-violet-600 border-violet-300">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </Badge>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'paste', label: 'Colar lista', icon: Copy },
          { id: 'upload', label: 'Upload CSV', icon: Upload },
          { id: 'manual', label: 'Adicionar um', icon: Plus },
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setInputMode(mode.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              inputMode === mode.id
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            <mode.icon className="w-4 h-4" />
            {mode.label}
          </button>
        ))}
      </div>

      {/* Error messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            {errors.map((error, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input modes */}
      {inputMode === 'paste' && (
        <div className="space-y-3">
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Cole aqui sua lista de itens (um por linha, ou separados por vírgula)"
            className="min-h-[120px] resize-none"
          />
          <GradientButton 
            onClick={() => parseAndAddItems(textInput)}
            disabled={!textInput.trim()}
            icon={Plus}
          >
            Adicionar itens
          </GradientButton>
        </div>
      )}

      {inputMode === 'upload' && (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-violet-400 transition-colors">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Clique para selecionar ou arraste um arquivo CSV/TXT
            </span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>
      )}

      {inputMode === 'manual' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              value={manualItem}
              onChange={(e) => setManualItem(e.target.value)}
              placeholder="Digite o item"
              onKeyDown={(e) => e.key === 'Enter' && addManualItem()}
            />
          </div>
          {useWeights && (
            <div className="w-24">
              <Input
                type="number"
                value={manualWeight}
                onChange={(e) => setManualWeight(parseInt(e.target.value) || 1)}
                min={1}
                placeholder="Peso"
              />
            </div>
          )}
          <GradientButton onClick={addManualItem} icon={Plus}>
            Adicionar
          </GradientButton>
        </div>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-700 dark:text-gray-300">Lista de itens</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar tudo
            </Button>
          </div>
          
          <ScrollArea className="h-[200px] rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-2 space-y-1">
              {items.map((item, index) => (
                <motion.div
                  key={`${item.value}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg group"
                >
                  <span className="text-xs text-gray-400 w-8 text-right">
                    #{index + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {item.value}
                  </span>
                  {useWeights && (
                    <div className="flex items-center gap-1">
                      <Scale className="w-3 h-3 text-amber-500" />
                      <Input
                        type="number"
                        value={item.weight}
                        onChange={(e) => updateItemWeight(index, parseInt(e.target.value) || 1)}
                        className="w-16 h-7 text-xs"
                        min={1}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => removeItem(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500 transition-all"
                    aria-label={`Remover ${item.value}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </GlassCard>
  );
}