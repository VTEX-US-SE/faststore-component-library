import { Command } from 'commander'
import { addCommand } from './commands/add'

const program = new Command()

program
  .name('equipo-components')
  .description('Internal CLI for the Solutions Engineering team to consume FastStore v4 components')
  .version('0.0.0')

program.addCommand(addCommand)

program.parse(process.argv)
