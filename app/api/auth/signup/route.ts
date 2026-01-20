import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = signupSchema.parse(body)

    const supabase = getSupabase()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({
        id: uuidv4(),
        email,
        password: hashedPassword,
        name: name || null,
        theme: 'american-robin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return NextResponse.json(
      { message: 'User created successfully', userId: user?.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
