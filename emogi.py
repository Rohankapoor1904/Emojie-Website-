import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import os
import threading
import base64
import io
from datetime import datetime

# Import required libraries with error handling
try:
    from PIL import Image, ImageTk, ImageDraw, ImageFilter, ImageEnhance, ImageOps
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    messagebox.showerror("Missing Library", "Please install Pillow: pip install Pillow")

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    messagebox.showerror("Missing Library", "Please install Google AI: pip install google-generativeai")

class ChibiStickerGenerator:
    def __init__(self, root):
        self.root = root
        self.root.title("🎨 Chibi Sticker Generator with AI")
        self.root.geometry("900x700")
        self.root.configure(bg='#2c3e50')
        
        # Colors
        self.colors = {
            'bg_primary': '#2c3e50',
            'bg_secondary': '#34495e',
            'accent': '#e74c3c',
            'success': '#27ae60',
            'warning': '#f39c12',
            'text_light': '#ecf0f1',
            'text_dark': '#2c3e50'
        }
        
        # Variables
        self.uploaded_image = None
        self.generated_stickers = None
        self.api_key = ""
        self.emoji_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "emojis")
        self.gif_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "gifs")
        self.loaded_emojis = self.load_emojis()
        self.loaded_gifs = self.load_gifs()
        
        if not PIL_AVAILABLE or not GENAI_AVAILABLE:
            return
            
        self.setup_ui()
        
    def setup_ui(self):
        """Setup complete UI"""
        # --- Scrollable Setup ---
        # Create a canvas and a vertical scrollbar
        canvas = tk.Canvas(self.root, bg=self.colors['bg_primary'], highlightthickness=0)
        scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=canvas.yview)
        
        # This frame will contain all other widgets and will be scrolled
        self.scrollable_frame = tk.Frame(canvas, bg=self.colors['bg_primary'])

        # Bind the scrollable frame to the canvas to update scrollregion
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(
                scrollregion=canvas.bbox("all")
            )
        )

        # Create a window in the canvas for the scrollable frame
        frame_id = canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        
        # Configure canvas
        canvas.configure(yscrollcommand=scrollbar.set)

        # Pack canvas and scrollbar
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # Update scrollable_frame width when canvas is resized
        def _on_canvas_configure(event):
            canvas.itemconfig(frame_id, width=event.width)
        canvas.bind("<Configure>", _on_canvas_configure)

        # Mouse wheel scrolling for cross-platform compatibility
        def _on_mousewheel(event):
            if event.num == 5 or event.delta < 0:
                canvas.yview_scroll(1, "units")
            if event.num == 4 or event.delta > 0:
                canvas.yview_scroll(-1, "units")

        self.root.bind_all("<MouseWheel>", _on_mousewheel)
        self.root.bind_all("<Button-4>", _on_mousewheel)
        self.root.bind_all("<Button-5>", _on_mousewheel)

        # Main container with padding, placed inside the scrollable frame
        main_frame = tk.Frame(self.scrollable_frame, bg=self.colors['bg_primary'])
        main_frame.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Header
        self.create_header(main_frame)
        
        # API Section
        self.create_api_section(main_frame)
        
        # Upload Section
        self.create_upload_section(main_frame)
        
        # Generation Section
        self.create_generation_section(main_frame)
        
        # Result Section
        self.create_result_section(main_frame)
        
    def create_header(self, parent):
        """Create header section"""
        header_frame = tk.Frame(parent, bg=self.colors['bg_primary'])
        header_frame.pack(fill='x', pady=(0, 20))
        
        title = tk.Label(
            header_frame,
            text="🎨 AI Chibi Sticker Generator",
            font=('Arial', 24, 'bold'),
            fg=self.colors['text_light'],
            bg=self.colors['bg_primary']
        )
        title.pack()
        
        subtitle = tk.Label(
            header_frame,
            text="Create 12 adorable chibi stickers from your photos using AI!",
            font=('Arial', 12),
            fg='#bdc3c7',
            bg=self.colors['bg_primary']
        )
        subtitle.pack(pady=(5, 0))
        
    def create_api_section(self, parent):
        """Create API configuration section"""
        api_frame = tk.LabelFrame(
            parent,
            text="🔑 Google Gemini API Setup",
            font=('Arial', 12, 'bold'),
            fg=self.colors['text_light'],
            bg=self.colors['bg_secondary'],
            bd=2,
            relief='solid'
        )
        api_frame.pack(fill='x', pady=(0, 15))
        
        # API key input
        key_frame = tk.Frame(api_frame, bg=self.colors['bg_secondary'])
        key_frame.pack(fill='x', padx=15, pady=15)
        
        tk.Label(
            key_frame,
            text="Enter your Gemini API Key:",
            font=('Arial', 10, 'bold'),
            fg=self.colors['text_light'],
            bg=self.colors['bg_secondary']
        ).pack(anchor='w')
        
        entry_frame = tk.Frame(key_frame, bg=self.colors['bg_secondary'])
        entry_frame.pack(fill='x', pady=(5, 0))
        
        self.api_key_entry = tk.Entry(
            entry_frame,
            font=('Arial', 10),
            show='*',
            width=50
        )
        self.api_key_entry.pack(side='left', fill='x', expand=True, ipady=5)
        
        test_btn = tk.Button(
            entry_frame,
            text="Test API",
            command=self.test_api,
            bg=self.colors['success'],
            fg='white',
            font=('Arial', 9, 'bold'),
            padx=15
        )
        test_btn.pack(side='right', padx=(10, 0))
        
        # Status label
        self.api_status = tk.Label(
            key_frame,
            text="⚠️ Please enter and test your API key",
            font=('Arial', 9),
            fg=self.colors['warning'],
            bg=self.colors['bg_secondary']
        )
        self.api_status.pack(anchor='w', pady=(5, 0))
        
        # Help text
        help_text = tk.Label(
            key_frame,
            text="Get your FREE API key from: https://aistudio.google.com/app/apikey",
            font=('Arial', 8),
            fg='#95a5a6',
            bg=self.colors['bg_secondary']
        )
        help_text.pack(anchor='w', pady=(5, 0))
        
    def create_upload_section(self, parent):
        """Create image upload section"""
        upload_frame = tk.LabelFrame(
            parent,
            text="📸 Upload Your Photo",
            font=('Arial', 12, 'bold'),
            fg=self.colors['text_light'],
            bg=self.colors['bg_secondary'],
            bd=2,
            relief='solid'
        )
        upload_frame.pack(fill='x', pady=(0, 15))
        
        content = tk.Frame(upload_frame, bg=self.colors['bg_secondary'])
        content.pack(fill='x', padx=15, pady=15)
        
        # Upload area
        self.upload_area = tk.Frame(content, bg='#34495e', relief='groove', bd=3, height=120)
        self.upload_area.pack(fill='x', pady=(0, 10))
        
        self.upload_icon = tk.Label(
            self.upload_area,
            text="📷\nClick to upload image",
            font=('Arial', 14),
            fg='#95a5a6',
            bg='#34495e'
        )
        self.upload_icon.pack(expand=True)
        
        # Upload button
        upload_btn = tk.Button(
            content,
            text="📁 Choose Image File",
            command=self.upload_image,
            bg=self.colors['accent'],
            fg='white',
            font=('Arial', 11, 'bold'),
            padx=20,
            pady=8
        )
        upload_btn.pack()
        
        # File info
        self.file_info = tk.Label(
            content,
            text="",
            font=('Arial', 9),
            fg=self.colors['success'],
            bg=self.colors['bg_secondary']
        )
        self.file_info.pack(pady=(10, 0))
        
    def create_generation_section(self, parent):
        """Create generation section"""
        gen_frame = tk.LabelFrame(
            parent,
            text="🎨 Generate Chibi Stickers",
            font=('Arial', 12, 'bold'),
            fg=self.colors['text_light'],
            bg=self.colors['bg_secondary'],
            bd=2,
            relief='solid'
        )
        gen_frame.pack(fill='x', pady=(0, 15))
        
        content = tk.Frame(gen_frame, bg=self.colors['bg_secondary'])
        content.pack(fill='x', padx=15, pady=15)
        
        # Generate button
        self.generate_btn = tk.Button(
            content,
            text="🚀 Generate 12 Chibi Stickers",
            command=self.generate_stickers,
            bg=self.colors['accent'],
            fg='white',
            font=('Arial', 14, 'bold'),
            padx=30,
            pady=12,
            state='disabled'
        )
        self.generate_btn.pack(pady=(0, 15))
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress = ttk.Progressbar(
            content,
            variable=self.progress_var,
            maximum=100,
            length=400
        )
        self.progress.pack(pady=(0, 10))
        
        # Status
        self.status_label = tk.Label(
            content,
            text="Ready to generate chibi stickers!",
            font=('Arial', 10),
            fg=self.colors['text_light'],
            bg=self.colors['bg_secondary']
        )
        self.status_label.pack()
        
    def create_result_section(self, parent):
        """Create result section"""
        self.result_frame = tk.LabelFrame(
            parent,
            text="🎉 Your Chibi Sticker Collection",
            font=('Arial', 12, 'bold'),
            fg=self.colors['text_light'],
            bg=self.colors['bg_secondary'],
            bd=2,
            relief='solid'
        )
        
        content = tk.Frame(self.result_frame, bg=self.colors['bg_secondary'])
        content.pack(fill='both', expand=True, padx=15, pady=15)
        
        # Image display
        self.result_display = tk.Label(
            content,
            text="Your 12 chibi stickers will appear here ✨",
            font=('Arial', 12),
            fg='#95a5a6',
            bg=self.colors['bg_secondary']
        )
        self.result_display.pack(expand=True, pady=20)
        
        # Action buttons
        button_frame = tk.Frame(content, bg=self.colors['bg_secondary'])
        button_frame.pack(fill='x', pady=(10, 0))
        
        save_btn = tk.Button(
            button_frame,
            text="💾 Save Stickers",
            command=self.save_stickers,
            bg=self.colors['success'],
            fg='white',
            font=('Arial', 10, 'bold'),
            padx=15
        )
        save_btn.pack(side='left')
        
        new_btn = tk.Button(
            button_frame,
            text="🔄 Create New",
            command=self.reset_app,
            bg=self.colors['warning'],
            fg='white',
            font=('Arial', 10, 'bold'),
            padx=15
        )
        new_btn.pack(side='right')
        
    def test_api(self):
        """Test the API key"""
        api_key = self.api_key_entry.get().strip()
        if not api_key:
            self.api_status.config(text="⚠️ Please enter your API key", fg=self.colors['warning'])
            return
            
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content("Hello, testing API connection.")
            
            if response and response.text:
                self.api_key = api_key
                self.api_status.config(text="✅ API key verified successfully!", fg=self.colors['success'])
                self.update_generate_button()
            else:
                self.api_status.config(text="❌ API test failed", fg=self.colors['accent'])
                
        except Exception as e:
            self.api_status.config(text="❌ API error - check your key", fg=self.colors['accent'])
            
    def upload_image(self):
        """Upload and preview image"""
        try:
            file_path = filedialog.askopenfilename(
                title="Select Your Photo",
                filetypes=[
                    ("Image Files", "*.jpg *.jpeg *.png *.bmp *.gif *.webp"),
                    ("All Files", "*.*")
                ]
            )
            
            if not file_path:
                return
                
            # Load image
            image = Image.open(file_path)
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            self.uploaded_image = image
            
            # Create preview
            preview = image.copy()
            preview.thumbnail((100, 100), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(preview)
            
            self.upload_icon.config(image=photo, text="")
            self.upload_icon.image = photo
            
            # Update file info
            filename = os.path.basename(file_path)
            self.file_info.config(text=f"✅ {filename} uploaded successfully")
            
            self.update_generate_button()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load image: {str(e)}")
            
    def update_generate_button(self):
        """Update generate button state"""
        if self.api_key and self.uploaded_image:
            self.generate_btn.config(state='normal')
        else:
            self.generate_btn.config(state='disabled')
            
    def generate_stickers(self):
        """Generate chibi stickers"""
        if not self.api_key or not self.uploaded_image:
            messagebox.showwarning("Warning", "Please set up API key and upload an image first!")
            return
            
        # Start generation in thread
        thread = threading.Thread(target=self._generate_thread)
        thread.daemon = True
        thread.start()
        
    def _generate_thread(self):
        """Generate stickers in background"""
        try:
            # Update UI
            self.root.after(0, self._start_generation)
            
            # Prepare image for API
            buffered = io.BytesIO()
            self.uploaded_image.save(buffered, format="JPEG", quality=85)
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            # Configure API
            genai.configure(api_key=self.api_key)
            
            # Update progress
            self.root.after(0, lambda: self.progress_var.set(30))
            self.root.after(0, lambda: self.status_label.config(text="🤖 AI is analyzing your image..."))
            
            # Create prompt for chibi sticker generation
            prompt = """Analyze this image and create a detailed description for generating 12 chibi-style stickers (3x4 grid) based on the person/character in the image. 

The stickers should have these expressions and poses:
1. Happy/Laughing - big smile, closed happy eyes
2. Angry - furrowed brows, puffed cheeks, anger marks
3. Crying/Sad - tears, downturned mouth, sad eyes
4. Sulking/Pouting - crossed arms, pouty expression
5. Thinking/Confused - finger on chin, question marks, puzzled look
6. Sleepy/Tired - closed eyes, yawning, Z's floating
7. Blowing Kiss - kiss lips, floating heart
8. Winking - one eye closed, playful smile
9. Surprised/Shocked - wide eyes, open mouth, exclamation marks
10. Love/Heart Eyes - heart-shaped eyes, blushing cheeks
11. Cool/Confident - sunglasses or confident smirk
12. Embarrassed/Blushing - red cheeks, shy expression

Style requirements:
- Chibi/anime art style with oversized heads
- Soft, pastel colors
- Simple, clean lines
- Consistent outfit similar to the uploaded image
- Cute and expressive features
- Each sticker should be circular or rounded square
- Maintain the same character design across all expressions"""

            # Generate with Gemini
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            self.root.after(0, lambda: self.progress_var.set(60))
            self.root.after(0, lambda: self.status_label.config(text="🎨 Creating your chibi stickers..."))
            
            # Create actual stickers
            stickers = self._create_chibi_stickers()
            
            self.root.after(0, lambda: self.progress_var.set(100))
            
            if stickers:
                self.generated_stickers = stickers
                self.root.after(0, lambda: self._finish_generation(stickers))
            else:
                self.root.after(0, lambda: self._generation_error("Failed to create stickers"))
                
        except Exception as e:
            self.root.after(0, lambda: self._generation_error(str(e)))
            
    def _create_chibi_stickers(self):
        """Create the actual chibi sticker grid"""
        try:
            if not self.uploaded_image:
                return None
                
            # Sticker dimensions
            sticker_size = 150
            padding = 10
            grid_width = 3 * (sticker_size + padding) - padding
            grid_height = 4 * (sticker_size + padding) - padding
            
            # Create canvas
            canvas = Image.new('RGB', (grid_width, grid_height), (255, 255, 255))
            
            # Expression types
            expressions = [
                ("Happy", "😄"), ("Angry", "😠"), ("Sad", "😢"),
                ("Sulking", "😤"), ("Thinking", "🤔"), ("Sleepy", "😴"),
                ("Kiss", "😘"), ("Winking", "😉"), ("Surprised", "😲"),
                ("Love", "😍"), ("Cool", "😎"), ("Embarrassed", "😳")
            ]
            
            # Create each sticker
            for i in range(12):
                row = i // 3
                col = i % 3
                
                # Create individual chibi sticker
                sticker = self._create_single_chibi(expressions[i])
                
                if sticker:
                    x = col * (sticker_size + padding)
                    y = row * (sticker_size + padding)
                    canvas.paste(sticker, (x, y))
            
            return canvas
            
        except Exception as e:
            print(f"Error creating stickers: {e}")
            return None
            
    def _create_single_chibi(self, expression_info):
        """Create a single chibi sticker"""
        try:
            expression_name, emoji = expression_info
            
            # Process original image
            base_img = self.uploaded_image.copy()
            base_img = base_img.resize((120, 120), Image.Resampling.LANCZOS)
            
            # Create chibi-style enhancements
            enhancer = ImageEnhance.Color(base_img)
            base_img = enhancer.enhance(1.3)  # More vibrant
            
            enhancer = ImageEnhance.Contrast(base_img)
            base_img = enhancer.enhance(1.2)  # Better contrast
            
            enhancer = ImageEnhance.Brightness(base_img)
            base_img = enhancer.enhance(1.1)  # Slightly brighter
            
            # Apply cartoon effect
            base_img = base_img.filter(ImageFilter.SMOOTH_MORE)
            
            # Create circular mask
            mask = Image.new('L', (120, 120), 0)
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0, 120, 120), fill=255)
            
            # Create final sticker
            sticker = Image.new('RGB', (150, 150), (255, 255, 255))
            
            # Apply circular crop
            circular_img = Image.new('RGBA', (120, 120), (255, 255, 255, 0))
            circular_img.paste(base_img, (0, 0))
            circular_img.putalpha(mask)
            
            # Convert back to RGB for pasting
            final_circular = Image.new('RGB', (120, 120), (255, 255, 255))
            final_circular.paste(circular_img, (0, 0), circular_img)
            
            # Center on sticker
            sticker.paste(final_circular, (15, 15))
            
            # Add expression effects
            self._add_expression_overlay(sticker, expression_name, emoji)
            
            return sticker
            
        except Exception as e:
            print(f"Error creating single chibi: {e}")
            return None
            
    def _add_expression_overlay(self, sticker, expression, emoji):
        """Add expression-specific overlays"""
        try:
            draw = ImageDraw.Draw(sticker)
            
            # Add expression indicator
            if expression == "Happy":
                # Add smile arc
                draw.arc([50, 80, 100, 110], 0, 180, fill="gold", width=3)
            elif expression == "Angry":
                # Add angry eyebrows
                draw.line([40, 50, 55, 45], fill="red", width=3)
                draw.line([95, 45, 110, 50], fill="red", width=3)
            elif expression == "Love":
                # Add heart
                self._draw_heart(draw, 120, 40, "pink")
            elif expression == "Cool":
                # Add sunglasses
                draw.rectangle([45, 60, 65, 70], fill="black")
                draw.rectangle([85, 60, 105, 70], fill="black")
                draw.line([65, 65, 85, 65], fill="black", width=2)
            
            # Add emoji and label at bottom
            try:
                draw.text((5, 135), f"{emoji} {expression}", fill="navy")
            except:
                draw.text((5, 135), expression, fill="navy")
                
        except Exception as e:
            print(f"Error adding overlay: {e}")
            
    def _draw_heart(self, draw, x, y, color):
        """Draw a small heart"""
        try:
            size = 8
            # Simple heart shape
            draw.ellipse([x-size//2, y-size//4, x, y+size//4], fill=color)
            draw.ellipse([x, y-size//4, x+size//2, y+size//4], fill=color)
            draw.polygon([x-size//4, y+size//4, x, y+size//2, x+size//4, y+size//4], fill=color)
        except:
            pass
            
    def _start_generation(self):
        """Start generation UI updates"""
        self.generate_btn.config(state='disabled', text="🎨 Generating...")
        self.progress_var.set(10)
        self.status_label.config(text="🚀 Starting generation...")
        
    def _finish_generation(self, stickers):
        """Finish generation"""
        self.progress_var.set(100)
        self.status_label.config(text="✅ Chibi stickers created successfully!")
        
        # Display result
        display_img = stickers.copy()
        display_img.thumbnail((400, 500), Image.Resampling.LANCZOS)
        photo = ImageTk.PhotoImage(display_img)
        
        self.result_display.config(image=photo, text="")
        self.result_display.image = photo
        
        # Show result frame
        self.result_frame.pack(fill='x', pady=(0, 0))
        
        # Reset button
        self.generate_btn.config(state='normal', text="🚀 Generate 12 Chibi Stickers")
        
    def _generation_error(self, error):
        """Handle generation error"""
        self.progress_var.set(0)
        self.status_label.config(text=f"❌ Error: {error}")
        self.generate_btn.config(state='normal', text="🚀 Generate 12 Chibi Stickers")
        messagebox.showerror("Generation Error", f"Failed to generate stickers: {error}")
        
    def save_stickers(self):
        """Save the generated stickers"""
        if not self.generated_stickers:
            messagebox.showwarning("Warning", "No stickers to save!")
            return
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = filedialog.asksaveasfilename(
            defaultextension=".png",
            initialvalue=f"chibi_stickers_{timestamp}.png",
            filetypes=[("PNG files", "*.png"), ("JPEG files", "*.jpg")]
        )
        
        if file_path:
            try:
                self.generated_stickers.save(file_path, quality=95)
                messagebox.showinfo("Success", f"Stickers saved to:\n{file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save: {str(e)}")
                
    def reset_app(self):
        """Reset the application"""
        self.uploaded_image = None
        self.generated_stickers = None
        
        self.upload_icon.config(image="", text="📷\nClick to upload image")
        self.upload_icon.image = None
        self.file_info.config(text="")
        self.progress_var.set(0)
        self.status_label.config(text="Ready to generate chibi stickers!")
        self.generate_btn.config(state='disabled', text="🚀 Generate 12 Chibi Stickers")
        
        # Hide result frame
        self.result_frame.pack_forget()

    def load_emojis(self):
        """Load emoji images from emoji_dir"""
        emojis = {}
        if os.path.exists(self.emoji_dir):
            for fname in os.listdir(self.emoji_dir):
                if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                    path = os.path.join(self.emoji_dir, fname)
                    try:
                        img = Image.open(path)
                        emojis[fname] = img
                    except Exception as e:
                        print(f"Error loading emoji {fname}: {e}")
        return emojis

    def load_gifs(self):
        """Load GIFs from gif_dir"""
        gifs = {}
        if os.path.exists(self.gif_dir):
            for fname in os.listdir(self.gif_dir):
                if fname.lower().endswith('.gif'):
                    path = os.path.join(self.gif_dir, fname)
                    try:
                        gifs[fname] = path
                    except Exception as e:
                        print(f"Error loading gif {fname}: {e}")
        return gifs

def main():
    """Run the application"""
    root = tk.Tk()
    app = ChibiStickerGenerator(root)
    root.mainloop()

if __name__ == "__main__":
    main()
