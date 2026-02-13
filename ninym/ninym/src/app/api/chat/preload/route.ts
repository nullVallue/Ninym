

import { NextRequest, NextResponse } from "next/server";
import ollama from 'ollama';


let modelPreloaded = false;
const model = "gemma3n"
