import { Command } from 'commander'
import { addCommand } from './commands/add'
import { addResolverCommand } from './commands/add-resolver'

const program = new Command()

program
  .name('se-components')
  .description('Internal CLI for the Solutions Engineering team to consume FastStore v4 components')
  .version('0.0.0')

program.addCommand(addCommand)
program.addCommand(addResolverCommand)

program.parse(process.argv)
