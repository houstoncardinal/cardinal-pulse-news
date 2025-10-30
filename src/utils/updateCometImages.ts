import { supabase } from "@/integrations/supabase/client";
import cometImage from "@/assets/3i-atlas-comet.jpg";

export const updateCometArticleImages = async () => {
  const articleIds = [
    'f4a3f3d4-a483-468d-9a54-ff61d67a9e01',
    '4154e2dc-b17b-4352-860b-53de97f95f3a',
    'e295523e-0ea0-4281-8d1d-3e7fac93b128',
    'e6ee56e9-80ae-441c-ad0d-40eeb426f7a3',
    '3ae8105d-73ab-4080-a734-ad313099e00f'
  ];

  const { data, error } = await supabase
    .from('articles')
    .update({
      featured_image: cometImage,
      image_url: cometImage,
      og_image: cometImage,
      image_credit: 'AI Generated Astronomical Visualization',
      updated_at: new Date().toISOString()
    })
    .in('id', articleIds)
    .select();

  if (error) {
    console.error('Error updating comet article images:', error);
    throw error;
  }

  console.log('Successfully updated comet article images:', data);
  return data;
};
