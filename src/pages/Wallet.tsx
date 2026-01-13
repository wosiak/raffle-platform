import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  ArrowLeft,
  Trophy,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  QrCode,
  Copy,
  CheckCircle,
  History,
  CreditCard
} from "lucide-react";

const transactionTypeLabels = {
  credit_win: 'Crédito ganho',
  credit_redemption: 'Resgate',
  credit_adjustment: 'Ajuste',
  voucher_generated: 'Voucher gerado',
  voucher_used: 'Voucher utilizado'
};

const transactionTypeIcons = {
  credit_win: Trophy,
  credit_redemption: ArrowDownRight,
  credit_adjustment: CreditCard,
  voucher_generated: Gift,
  voucher_used: CheckCircle
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState(0);
  const [generatedVoucher, setGeneratedVoucher] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  const { data: members = [] } = useQuery({
    queryKey: ['my-member', user?.email],
    queryFn: () => base44.entities.Member.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (members.length > 0) {
      setMember(members[0]);
    }
  }, [members]);

  const { data: transactions = [] } = useQuery({
    queryKey: ['my-transactions', member?.id],
    queryFn: () => base44.entities.Transaction.filter({ member_id: member.id }, '-created_date', 50),
    enabled: !!member?.id,
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ['my-vouchers', member?.id],
    queryFn: () => base44.entities.Voucher.filter({ member_id: member.id }, '-created_date', 20),
    enabled: !!member?.id,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['active-partners'],
    queryFn: () => base44.entities.Partner.filter({ status: 'active' }),
  });

  const redeemMutation = useMutation({
    mutationFn: async ({ partner, amount }) => {
      if (!member?.organization_id) {
        throw new Error('Membro não possui organização. Por favor, recarregue a página.');
      }
      const rate = partner.redemption_rules?.credits_to_currency_rate || 1;
      const currencyValue = amount / rate;
      const voucherCode = `WC${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Create voucher
      const voucher = await base44.entities.Voucher.create({
        organization_id: member.organization_id,
        member_id: member.id,
        partner_id: partner.id,
        code: voucherCode,
        qr_data: JSON.stringify({ code: voucherCode, partner: partner.name, value: currencyValue }),
        credits_amount: amount,
        currency_value: currencyValue,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Create transaction
      await base44.entities.Transaction.create({
        organization_id: member.organization_id,
        member_id: member.id,
        partner_id: partner.id,
        type: 'voucher_generated',
        amount: -amount,
        balance_before: member.credit_balance,
        balance_after: member.credit_balance - amount,
        voucher_code: voucherCode,
        status: 'completed'
      });

      // Update member balance
      await base44.entities.Member.update(member.id, {
        credit_balance: member.credit_balance - amount,
        total_spent: (member.total_spent || 0) + amount
      });

      return { voucher, voucherCode, currencyValue };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-member'] });
      queryClient.invalidateQueries({ queryKey: ['my-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['my-vouchers'] });
      setGeneratedVoucher(data);
    }
  });

  const copyVoucherCode = () => {
    if (generatedVoucher?.voucherCode) {
      navigator.clipboard.writeText(generatedVoucher.voucherCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center">
          <GlassCard className="p-8">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-4">Faça login para acessar sua carteira</h2>
            <GradientButton onClick={() => base44.auth.redirectToLogin()}>
              Entrar
            </GradientButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center">
          <GlassCard className="p-8">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-4">Você ainda não é um membro</h2>
            <p className="text-gray-500">Entre em contato com o administrador para ser adicionado ao Winners Club.</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-emerald-500" />
              Minha Carteira
            </h1>
            <p className="text-sm text-gray-500">
              Olá, {member.name}!
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <GlassCard className="p-8 mb-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Saldo disponível</p>
              <p className="text-5xl font-bold text-emerald-600">
                {(member.credit_balance || 0).toLocaleString()}
              </p>
              <p className="text-gray-500">créditos</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <GradientButton 
                variant="success" 
                size="lg"
                icon={Gift}
                onClick={() => setShowRedeemDialog(true)}
                disabled={!member.credit_balance || member.credit_balance <= 0}
              >
                Resgatar Créditos
              </GradientButton>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-emerald-200/30">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(member.total_earned || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total ganho</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(member.total_spent || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total gasto</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {member.wins_count || 0}
              </p>
              <p className="text-sm text-gray-500">Vitórias</p>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Vouchers */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-violet-500" />
              Meus Vouchers
            </h2>
            
            {vouchers.filter(v => v.status === 'active').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>Nenhum voucher ativo</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {vouchers.filter(v => v.status === 'active').map((voucher) => (
                    <motion.div
                      key={voucher.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-violet-700 dark:text-violet-300">
                          {voucher.code}
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Valor: R$ {voucher.currency_value?.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Expira em: {voucher.expires_at ? format(new Date(voucher.expires_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </GlassCard>

          {/* Transaction History */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Histórico de Transações
            </h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma transação</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const Icon = transactionTypeIcons[tx.type] || CreditCard;
                    const isPositive = tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                          <Icon className={`w-4 h-4 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{transactionTypeLabels[tx.type]}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(tx.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <span className={`font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </GlassCard>
        </div>

        {/* Partners Catalog */}
        <GlassCard className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            Parceiros Disponíveis
          </h2>
          
          {partners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>Nenhum parceiro disponível</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedPartner(partner);
                    setRedeemAmount(partner.redemption_rules?.min_credits || 10);
                    setShowRedeemDialog(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {partner.logo_url ? (
                      <img src={partner.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-xs text-gray-500">
                        Mín: {partner.redemption_rules?.min_credits || 10} créditos
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Redeem Dialog */}
        <Dialog open={showRedeemDialog && !generatedVoucher} onOpenChange={(open) => {
          if (!open) {
            setShowRedeemDialog(false);
            setSelectedPartner(null);
            setRedeemAmount(0);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-violet-500" />
                Resgatar Créditos
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div>
                <Label>Parceiro</Label>
                <Select
                  value={selectedPartner?.id || ''}
                  onValueChange={(id) => {
                    const partner = partners.find(p => p.id === id);
                    setSelectedPartner(partner);
                    if (partner) {
                      setRedeemAmount(partner.redemption_rules?.min_credits || 10);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPartner && (
                <>
                  <div>
                    <Label>Quantidade de créditos</Label>
                    <Input
                      type="number"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(parseInt(e.target.value) || 0)}
                      min={selectedPartner.redemption_rules?.min_credits || 1}
                      max={Math.min(
                        member.credit_balance || 0,
                        selectedPartner.redemption_rules?.max_credits_per_transaction || 99999
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mínimo: {selectedPartner.redemption_rules?.min_credits || 10} | 
                      Seu saldo: {member.credit_balance || 0}
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valor do voucher:</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      R$ {(redeemAmount / (selectedPartner.redemption_rules?.credits_to_currency_rate || 1)).toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRedeemDialog(false)}>
                Cancelar
              </Button>
              <GradientButton
                onClick={() => redeemMutation.mutate({ partner: selectedPartner, amount: redeemAmount })}
                loading={redeemMutation.isPending}
                disabled={
                  !selectedPartner || 
                  redeemAmount < (selectedPartner?.redemption_rules?.min_credits || 1) ||
                  redeemAmount > (member.credit_balance || 0)
                }
              >
                Gerar Voucher
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generated Voucher Dialog */}
        <Dialog open={!!generatedVoucher} onOpenChange={() => {
          setGeneratedVoucher(null);
          setShowRedeemDialog(false);
          setSelectedPartner(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                Voucher Gerado!
              </DialogTitle>
            </DialogHeader>

            {generatedVoucher && (
              <div className="py-4 text-center">
                <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 mb-4">
                  <QrCode className="w-20 h-20 mx-auto mb-4 text-violet-500" />
                  <p className="text-2xl font-mono font-bold text-violet-700 dark:text-violet-300">
                    {generatedVoucher.voucherCode}
                  </p>
                  <p className="text-gray-500 mt-2">
                    Valor: R$ {generatedVoucher.currencyValue?.toFixed(2)}
                  </p>
                </div>

                <Button onClick={copyVoucherCode} variant="outline" className="gap-2">
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar código
                    </>
                  )}
                </Button>

                <p className="text-sm text-gray-500 mt-4">
                  Apresente este código no parceiro selecionado para utilizar seus créditos.
                </p>
              </div>
            )}

            <DialogFooter>
              <GradientButton onClick={() => {
                setGeneratedVoucher(null);
                setShowRedeemDialog(false);
                setSelectedPartner(null);
              }}>
                Fechar
              </GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}