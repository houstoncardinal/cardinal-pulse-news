import { supabase } from "@/integrations/supabase/client";
import chipotleImage from "@/assets/chipotle-digital-business.jpg";

export const fixChipotleArticle = async () => {
  const { data, error } = await supabase
    .from('articles')
    .update({
      featured_image: chipotleImage,
      image_url: chipotleImage,
      og_image: chipotleImage,
      image_credit: 'AI Generated - Chipotle Mexican Grill',
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'chipotles-digital-edge-beyond-burritos-a-gen-z-sto-gxzcof')
    .select();

  if (error) {
    console.error('Error fixing Chipotle article:', error);
    throw error;
  }

  console.log('✓ Chipotle article image fixed successfully');
  return data;
};
