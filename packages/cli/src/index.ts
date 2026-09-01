import { Command } from 'commander'
import { addCommand } from './commands/add'

const program = new Command()

program
  .name('equipo-components')
  .description('CLI interna del equipo de Solutions Engineering para consumir componentes de FastStore v4')
  .version('0.0.0')

program.addCommand(addCommand)

program.parse(process.argv)
