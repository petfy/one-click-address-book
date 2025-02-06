import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Briefcase, MapPin, User, Users, Building2 } from "lucide-react";
import { formatRUT, isValidRUT } from "@/lib/format-rut";
import { chileRegions } from "@/lib/chile-regions";
import "/node_modules/flag-icons/css/flag-icons.min.css";

interface AddressFormProps {
  onSuccess: () => void;
  initialData?: {
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    is_default: boolean;
    category: "casa" | "trabajo" | "vecino" | "amigo" | "familiares" | "conserje" | "otro";
    email?: string;
    phone?: string;
    identification?: string;
    full_name?: string;
  };
}

const categories = [
  { value: "casa" as const, label: "Casa", icon: Home },
  { value: "trabajo" as const, label: "Trabajo", icon: Briefcase },
  { value: "vecino" as const, label: "Vecino", icon: Users },
  { value: "amigo" as const, label: "Amigo", icon: User },
  { value: "familiares" as const, label: "Familiares", icon: Users },
  { value: "conserje" as const, label: "Conserje", icon: Building2 },
  { value: "otro" as const, label: "Otro", icon: MapPin },
];

const countries = [
  { code: "CL", name: "Chile" },
  { code: "AR", name: "Argentina" },
  { code: "PE", name: "Perú" },
  { code: "BR", name: "Brasil" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "México" },
  { code: "US", name: "Estados Unidos" },
  { code: "ES", name: "España" },
];

export const AddressForm = ({ onSuccess, initialData }: AddressFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [identification, setIdentification] = useState(initialData?.identification || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [country, setCountry] = useState(initialData?.country || "CL");
  const [region, setRegion] = useState(initialData?.state || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [zipCode, setZipCode] = useState(initialData?.zip_code || "");
  const [street, setStreet] = useState(initialData?.street || "");
  const [label, setLabel] = useState(initialData?.label || "");
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);
  const [category, setCategory] = useState<typeof categories[number]["value"]>(initialData?.category || "otro");
  const [selectedCategory, setSelectedCategory] = useState(category);

  const handleIdentificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9kK-]/g, '');
    setIdentification(formatRUT(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No se encontró usuario");

      if (identification && !isValidRUT(identification)) {
        toast({
          title: "Error",
          description: "El RUT ingresado no es válido",
          variant: "destructive",
        });
        return;
      }

      const addressData = {
        label,
        street,
        city,
        state: country === "CL" ? region : state,
        zip_code: zipCode,
        country,
        is_default: isDefault,
        user_id: user.id,
        category,
        email,
        phone,
        identification,
        full_name: fullName,
      };

      if (initialData) {
        const { error } = await supabase
          .from("addresses")
          .update(addressData)
          .eq("id", initialData.id);
        
        if (error) throw error;
        toast({
          title: "¡Dirección actualizada!",
          description: "La dirección se ha actualizado correctamente.",
        });
      } else {
        const { error } = await supabase
          .from("addresses")
          .insert([addressData]);
        
        if (error) throw error;
        toast({
          title: "¡Dirección guardada!",
          description: "La dirección se ha guardado correctamente.",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Editar dirección" : "Nueva dirección"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.value}
                  type="button"
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  className="flex flex-col items-center p-2 h-auto"
                  onClick={() => {
                    setSelectedCategory(cat.value);
                    setCategory(cat.value);
                  }}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{cat.label}</span>
                </Button>
              );
            })}
          </div>

          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nombre y Apellido"
            required
          />

          <Input
            type="text"
            value={identification}
            onChange={handleIdentificationChange}
            placeholder="RUT"
          />

          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />

          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Teléfono"
          />

          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un país" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className={`fi fi-${country.code.toLowerCase()} mr-2`}></span>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {country === "CL" ? (
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una región" />
              </SelectTrigger>
              <SelectContent>
                {chileRegions.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Estado/Provincia"
              required
            />
          )}

          <Input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ciudad"
            required
          />

          <Input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Calle y número"
            required
          />

          <Input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Código Postal (opcional)"
          />

          <Input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Etiqueta (ej: Casa, Trabajo)"
            required
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isDefault" className="text-sm">
              Establecer como dirección predeterminada
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : initialData ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
