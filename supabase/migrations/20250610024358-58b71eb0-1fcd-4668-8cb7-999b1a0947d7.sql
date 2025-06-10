
-- Drop existing tables if they exist (in case they were already created)
DROP TABLE IF EXISTS public.custom_consolidation_memberships CASCADE;
DROP TABLE IF EXISTS public.custom_consolidations CASCADE;

-- Create custom consolidations table
CREATE TABLE public.custom_consolidations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  consolidation_type shipment_type NOT NULL, -- 'inbound', 'outbound', or 'intertheater'
  origin_port_id UUID REFERENCES public.ports(id) ON DELETE CASCADE,
  origin_region_id UUID REFERENCES public.port_regions(id) ON DELETE CASCADE,
  destination_port_id UUID REFERENCES public.ports(id) ON DELETE CASCADE,
  destination_region_id UUID REFERENCES public.port_regions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure at least one origin and one destination are specified
  CONSTRAINT check_origin_specified CHECK (
    (origin_port_id IS NOT NULL) OR (origin_region_id IS NOT NULL)
  ),
  CONSTRAINT check_destination_specified CHECK (
    (destination_port_id IS NOT NULL) OR (destination_region_id IS NOT NULL)
  ),
  -- Ensure origin can't be both port and region
  CONSTRAINT check_origin_exclusive CHECK (
    NOT (origin_port_id IS NOT NULL AND origin_region_id IS NOT NULL)
  ),
  -- Ensure destination can't be both port and region
  CONSTRAINT check_destination_exclusive CHECK (
    NOT (destination_port_id IS NOT NULL AND destination_region_id IS NOT NULL)
  )
);

-- Create custom consolidation memberships table
CREATE TABLE public.custom_consolidation_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_consolidation_id UUID NOT NULL REFERENCES public.custom_consolidations(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique membership within the same consolidation
  UNIQUE(custom_consolidation_id, shipment_id)
);

-- Create an immutable function to get organization_id from custom_consolidation_id
CREATE OR REPLACE FUNCTION get_consolidation_org_id(consolidation_id UUID)
RETURNS UUID
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT organization_id FROM public.custom_consolidations WHERE id = consolidation_id;
$$;

-- Add constraint to prevent a shipment from being in multiple custom consolidations for the same organization
CREATE UNIQUE INDEX idx_unique_shipment_per_org_consolidation 
ON public.custom_consolidation_memberships (
  shipment_id, 
  get_consolidation_org_id(custom_consolidation_id)
);

-- Add RLS policies for custom_consolidations
ALTER TABLE public.custom_consolidations ENABLE ROW LEVEL SECURITY;

-- Users can view custom consolidations from their organization
CREATE POLICY "Users can view organization custom consolidations" 
  ON public.custom_consolidations 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT p.organization_id 
      FROM public.profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- Users can create custom consolidations for their organization
CREATE POLICY "Users can create organization custom consolidations" 
  ON public.custom_consolidations 
  FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id 
      FROM public.profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- Users can update custom consolidations from their organization
CREATE POLICY "Users can update organization custom consolidations" 
  ON public.custom_consolidations 
  FOR UPDATE 
  USING (
    organization_id IN (
      SELECT p.organization_id 
      FROM public.profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- Users can delete custom consolidations from their organization
CREATE POLICY "Users can delete organization custom consolidations" 
  ON public.custom_consolidations 
  FOR DELETE 
  USING (
    organization_id IN (
      SELECT p.organization_id 
      FROM public.profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- Add RLS policies for custom_consolidation_memberships
ALTER TABLE public.custom_consolidation_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view memberships for consolidations in their organization (but can see ANY shipments)
CREATE POLICY "Users can view organization consolidation memberships" 
  ON public.custom_consolidation_memberships 
  FOR SELECT 
  USING (
    custom_consolidation_id IN (
      SELECT cc.id 
      FROM public.custom_consolidations cc
      JOIN public.profiles p ON p.organization_id = cc.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- Users can create memberships for consolidations in their organization (with ANY shipments)
CREATE POLICY "Users can create organization consolidation memberships" 
  ON public.custom_consolidation_memberships 
  FOR INSERT 
  WITH CHECK (
    custom_consolidation_id IN (
      SELECT cc.id 
      FROM public.custom_consolidations cc
      JOIN public.profiles p ON p.organization_id = cc.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- Users can delete memberships for consolidations in their organization
CREATE POLICY "Users can delete organization consolidation memberships" 
  ON public.custom_consolidation_memberships 
  FOR DELETE 
  USING (
    custom_consolidation_id IN (
      SELECT cc.id 
      FROM public.custom_consolidations cc
      JOIN public.profiles p ON p.organization_id = cc.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_custom_consolidations_org_type ON public.custom_consolidations(organization_id, consolidation_type);
CREATE INDEX idx_custom_consolidation_memberships_consolidation ON public.custom_consolidation_memberships(custom_consolidation_id);
CREATE INDEX idx_custom_consolidation_memberships_shipment ON public.custom_consolidation_memberships(shipment_id);
