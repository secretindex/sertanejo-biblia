import supabase from './utils/supabase';

import { BibleBook } from './types';

export let BIBLE_BOOKS: BibleBook[] = [];

(async () => {
  const { data, error } = await supabase.from("bible_book").select("*");
  if (error) {
    console.error("Error fetching Bible books:", error);
  } else {
    BIBLE_BOOKS = data;
    console.log("Bible books fetched successfully:", data);
  }
})();
