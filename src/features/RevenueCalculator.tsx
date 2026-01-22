import { useState, useEffect } from 'react'

interface RevenueCalculatorProps {
    totalSlots: number
    powerKw: number // Average power per slot
    proposedRent?: number
    proposedRevShare?: number
}

export function RevenueCalculator({
    totalSlots,
    powerKw,
    proposedRent = 0,
    proposedRevShare = 0
}: RevenueCalculatorProps) {
    // Assumptions / Inputs
    const [utilization, setUtilization] = useState(15) // % of time occupied
    const [tariff, setTariff] = useState(0.35) // $ per kWh
    const [costPerKwh, setCostPerKwh] = useState(0.15) // $ per kWh (Utility cost)

    // Calculated values
    const [monthlyRevenue, setMonthlyRevenue] = useState(0)
    const [monthlyCost, setMonthlyCost] = useState(0)
    const [monthlyNet, setMonthlyNet] = useState(0)
    const [landlordShare, setLandlordShare] = useState(0)

    useEffect(() => {
        // Calculations
        const hoursPerMonth = 730
        const activeHours = hoursPerMonth * (utilization / 100)

        // Total kWh sold = Slots * ActiveHours * Power
        const totalKwh = totalSlots * activeHours * powerKw

        const grossRevenue = totalKwh * tariff
        const utilityCost = totalKwh * costPerKwh
        const netOpIncome = grossRevenue - utilityCost

        // Landlord Share
        // If rent is fixed, they get rent.
        // If rev share, they get % of Gross (usually) or Net. Let's assume Gross for simplicity or standard.
        // Usually revenue share is on Gross Revenue (minus tax).

        let landlordIncome = proposedRent
        if (proposedRevShare > 0) {
            landlordIncome += (grossRevenue * (proposedRevShare / 100))
        }

        setMonthlyRevenue(grossRevenue)
        setMonthlyCost(utilityCost)
        setMonthlyNet(netOpIncome)
        setLandlordShare(landlordIncome)

    }, [utilization, tariff, costPerKwh, totalSlots, powerKw, proposedRent, proposedRevShare])

    const formatCurrency = (val: number) => `$${Math.round(val).toLocaleString()}`

    return (
        <div className="card p-6 bg-white/5 border border-white/5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="p-1.5 bg-green-500/10 text-green-500 rounded-lg">📊</span>
                Revenue Forecast
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted uppercase tracking-wider">Assumptions</h4>

                    <div>
                        <label className="text-xs text-muted block mb-1">Utilization (%)</label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={utilization}
                            onChange={(e) => setUtilization(Number(e.target.value))}
                            className="w-full accent-accent mb-1"
                        />
                        <div className="flex justify-between text-xs font-mono">
                            <span>1%</span>
                            <span className="text-accent font-bold">{utilization}%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-muted block mb-1">Tariff ($/kWh)</label>
                            <input
                                type="number"
                                className="input w-full p-2 text-sm bg-black/20"
                                value={tariff}
                                onChange={(e) => setTariff(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Cost ($/kWh)</label>
                            <input
                                type="number"
                                className="input w-full p-2 text-sm bg-black/20"
                                value={costPerKwh}
                                onChange={(e) => setCostPerKwh(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>

                {/* Outputs */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted uppercase tracking-wider">Monthly Estimates</h4>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 rounded hover:bg-white/5">
                            <span className="text-sm text-muted">Gross Revenue</span>
                            <span className="font-bold">{formatCurrency(monthlyRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded hover:bg-white/5">
                            <span className="text-sm text-muted">Energy Costs</span>
                            <span className="text-sm text-red-300">-{formatCurrency(monthlyCost)}</span>
                        </div>
                        <div className="border-t border-white/10 my-1"></div>
                        <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 bg-white/5">
                            <span className="text-sm font-medium">Net Operating Income</span>
                            <span className="font-bold text-green-400">{formatCurrency(monthlyNet)}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dashed border-white/20">
                        <div className="flex justify-between items-center">
                            <div className="text-sm">
                                <span className="block text-muted">Your Projected Share</span>
                                <span className="text-xs text-zinc-500">Rent + {proposedRevShare}% Share</span>
                            </div>
                            <div className="text-2xl font-bold text-accent">
                                {formatCurrency(landlordShare)}/mo
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
