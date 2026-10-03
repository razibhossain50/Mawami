import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  fullName: string;

  @Column({ unique: true })
  email: string;

  // Never loaded by default (keeps hashes out of relations and API responses);
  // use findWithPassword-style queries with addSelect('user.password') when needed
  @Column({ nullable: true, select: false })
  password: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ type: 'enum', enum: ['user', 'admin', 'superadmin'], default: 'user' })
  role: 'user' | 'admin' | 'superadmin';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
