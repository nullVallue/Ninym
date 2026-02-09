import ollama
import sys
import os
import re
import time


class Colors:
    def __init__(self):
        # Regular colors
        self.red = '\033[91m'
        self.green = '\033[92m'
        self.blue = '\033[94m'
        self.yellow = '\033[93m'
        self.magenta = '\033[95m'
        self.cyan = '\033[96m'
        self.white = '\033[97m'
        self.reset = '\033[0m'
    
    def colorize(self, text, color):
        """Add color to text and handle reset automatically"""
        color_code = getattr(self, color.lower(), '')
        return f"{color_code}{text}{self.reset}"



client = ollama.Client()
model = "ninym"

def clean_string(text):
    # Translation table for specific characters
    trans_table = str.maketrans('', '', '?!–\'\n:-')

    
    # Remove specific characters
    text = text.translate(trans_table)
    
    # Remove emojis using regex
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002500-\U00002BEF"  # Chinese/Japanese/Korean characters
        u"\U00002702-\U000027B0"
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001f926-\U0001f937"
        u"\U00010000-\U0010ffff"
        u"\u2640-\u2642" 
        u"\u2600-\u2B55"
        u"\u200d"
        u"\u23cf"
        u"\u23e9"
        u"\u231a"
        u"\ufe0f"  # dingbats
        u"\u3030"
                           "]+", flags=re.UNICODE)
    
    return emoji_pattern.sub(r'', text)


def main():

    terminal_width = os.get_terminal_size().columns

    prompt = ""
    colors = Colors()

    # chat = ChatTTS.Chat() 
    # chat.load(compile=True)
    # params_refine_text = ChatTTS.Chat.RefineTextParams(
    #     prompt='[oral_2][laugh_0][break_4]',
    # )

    engine = SystemEngine()
    stream = TextToAudioStream(engine)


    while prompt != "/exit":
        prompt = input(colors.colorize("\n\n>>> ", "yellow") )

        if(prompt != "/exit"):
            response = client.generate(model=model, prompt=prompt, stream=True)
            print("\n");
            currentLineLength = 0
            allText=""
            for res in response:
                currentLineLength += res.response.__len__()
                allText += res.response
                if(currentLineLength > terminal_width - 10):
                    print("")
                    currentLineLength = 0
                for char in res.response:
                    if(char == "\n"):
                        currentLineLength = 0
                    sys.stdout.write(colors.colorize(char, "cyan"))
                    sys.stdout.flush()

            time.sleep(1)
            stream.feed(clean_string(allText))
            stream.play()
            # stream.play_async()
            # while stream.is_playing():
            #     time.sleep(0.1)



            # wavs = chat.infer(clean_string(allText), params_refine_text=params_refine_text)
            # soundfile.write("output1.wav", wavs[0], 24000)
            # time.sleep(1)
            # pygame.mixer.init()
            # pygame.mixer.music.load("output1.wav")
            # pygame.mixer.music.play()
            # while pygame.mixer.get_busy():
            #     pass







main()