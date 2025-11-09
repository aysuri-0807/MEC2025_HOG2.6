
'''
Description: A helper function for calling Google Gemini text API. Provide a prompt, and instructions and receive a text output 
Author: Andy Suri
'''
from google import genai

client = genai.Client(api_key="AIzaSyCkt1dcG3QBnHyZZ8A2PoUJ4Ym6tpldQ8c")
# Call the generate_content method


def genResponse(prompt,instructions):
    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=instructions + prompt 
    )
    return response.text 

