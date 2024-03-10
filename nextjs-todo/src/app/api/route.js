import { NextRequest, NextResponse } from 'next/server';
const token = process.env.API_TOKEN;
const url = process.env.SERVER_URL;

export async function GET() {    
    const requestOptions = {
        headers: {
            "content-type": "application/json",
            "x-apikey": token
        }
    }
    const response = await fetch(url + '?sort=-_id', requestOptions); // sort by newest first
    const data = await response.json();
    console.log('Got from db', data);    
    return NextResponse.json(data);
}

export async function POST(req) {
    const body = await req.json();    
    const todo = {message: body.todo};

    const requestOptions = {
        method: "POST",
        headers: {
        "content-type": "application/json",
        "x-apikey": token
        },
        body: JSON.stringify(todo)
    }
    console.log("POST", url, requestOptions)
    const response = await fetch(url, requestOptions);
    const data = response.json();
    console.log("Got", data)    
    return NextResponse.json(data);
}

export async function DELETE(req) {
    const body = await req.json();  
    if (!body.todoID) {
        return NextResponse.status(400).send("todo parameter required.");
    }
    const todoID = body.todoID;
    console.log('Remove todo', todoID)
    const requestOptions = {
    method: 'DELETE',
        headers: {
            "content-type": "application/json",
            "x-apikey": token
        }
    }
    const respons = await fetch(url+'/'+todoID, requestOptions);
    const data = await respons.json();
    return NextResponse.json(data);
}