import { useState, useEffect } from "react";
import { BrandScope, getAllBrands, getUserBrandScope, resolveActiveBrand } from "@/lib/brandScope";
import { useAuth } from "@/contexts/AuthContext";

interface BrandPassSwitcherProps {
  onBrandChange: (brand: BrandScope) => void;
  selectedBrandId?: string;
}

const BrandPassSwitcher = ({ onBrandChange, selectedBrandId }: BrandPassSwitcherProps) => {
  const { user } = useAuth();
  const [allBrands, setAllBrands] = useState<BrandScope[]>([]);
  const [userBrands, setUserBrands] = useState<BrandScope[]>([]);
  const [selected, setSelected] = useState<string | null>(selectedBrandId || null);

  useEffect(() => {
    getAllBrands().then(setAllBrands);
    if (user) {
      getUserBrandScope(user.id).then((brands) => {
        setUserBrands(brands);
        if (!selected && brands.length > 0) {
          const resolved = resolveActiveBrand(brands);
          if (resolved) {
            setSelected(resolved.id);
            onBrandChange(resolved);
          }
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (selectedBrandId && selectedBrandId !== selected) {
      setSelected(selectedBrandId);
    }
  }, [selectedBrandId]);

  const handleSelect = (brand: BrandScope) => {
    if (!brand.active) return;
    setSelected(brand.id);
    onBrandChange(brand);
  };

  // Default to first active brand if nothing selected
  useEffect(() => {
    if (!selected && allBrands.length > 0) {
      const firstActive = allBrands.find((b) => b.active);
      if (firstActive) {
        setSelected(firstActive.id);
        onBrandChange(firstActive);
      }
    }
  }, [allBrands]);

  return (
    <div className="flex flex-wrap gap-2">
      {allBrands.map((brand) => {
        const isUserBrand = userBrands.some((b) => b.id === brand.id);
        const isSelected = selected === brand.id;
        return (
          <button
            key={brand.id}
            onClick={() => handleSelect(brand)}
            disabled={!brand.active}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : brand.active
                ? "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"
                : "border-muted/30 text-muted-foreground/40 cursor-not-allowed"
            }`}
          >
            {brand.name}
            {isUserBrand && brand.active && <span className="ml-1 text-[10px]">✓</span>}
            {!brand.active && <span className="ml-1 text-[10px]">Coming Soon</span>}
          </button>
        );
      })}
    </div>
  );
};

export default BrandPassSwitcher;
